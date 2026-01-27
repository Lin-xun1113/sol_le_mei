"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useProgram, getUserProfilePDA, getVaultPDA, getGraveyardPDA, getDeathRecordPDA, PROGRAM_ID } from "@/hooks/useProgram";
import { BN } from "@coral-xyz/anchor";

// V3: 3天冷却期常量
const THREE_DAYS_SECONDS = 3 * 24 * 60 * 60;

interface TargetUser {
    address: PublicKey;
    profilePDA: PublicKey;
    vaultPDA: PublicKey;
    vaultBalance: number;
    beneficiary: PublicKey;
    ripCount: number;
    lastPulse: number;
    timeoutSeconds: number;
    isDead: boolean;
    deathTime: number;       // V3: 死亡时间戳
    expiredSeconds: number;  // 超时了多久
    isSelf: boolean;         // V3: 是否是自己
}

export default function HuntPage() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { program } = useProgram();

    const [dyingUsers, setDyingUsers] = useState<TargetUser[]>([]);
    const [deadUsers, setDeadUsers] = useState<TargetUser[]>([]);
    const [selfDeadProfile, setSelfDeadProfile] = useState<TargetUser | null>(null); // V3: 自己死亡时的数据
    const [isLoading, setIsLoading] = useState(true);
    const [processingAddress, setProcessingAddress] = useState<string | null>(null);

    // 获取所有目标用户
    const fetchTargets = useCallback(async () => {
        if (!program) return;

        try {
            // 只扫描 V3 账户 (120 bytes)，忽略老版本避免 429 错误
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [{ dataSize: 120 }],
            });


            const dying: TargetUser[] = [];
            const dead: TargetUser[] = [];
            let selfDead: TargetUser | null = null;
            const now = Math.floor(Date.now() / 1000);

            for (const account of accounts) {
                try {
                    const profilePDA = account.pubkey;
                    const data = await (program.account as Record<string, {
                        fetch: (pda: PublicKey) => Promise<{
                            owner: PublicKey;
                            lastPulse: BN;
                            timeoutSeconds: BN;
                            beneficiary: PublicKey;
                            mode: number;
                            isDead: boolean;
                            ripCount: number;
                            deathTime: BN;  // V3
                        }>
                    }>).userProfile.fetch(profilePDA);



                    // 只处理 Feast 模式
                    if (data.mode !== 1) continue;

                    const [vaultPDA] = getVaultPDA(data.owner);
                    const vaultBalance = await connection.getBalance(vaultPDA);

                    // 跳过没有余额的（除非是自己）
                    const isSelf = publicKey ? data.owner.equals(publicKey) : false;
                    if (vaultBalance <= 0 && !isSelf) continue;

                    const lastPulse = data.lastPulse.toNumber();
                    const timeoutSeconds = data.timeoutSeconds.toNumber();
                    const deadline = lastPulse + timeoutSeconds;
                    const expiredSeconds = now - deadline;
                    const deathTime = data.deathTime?.toNumber() || 0;



                    const target: TargetUser = {
                        address: data.owner,
                        profilePDA,
                        vaultPDA,
                        vaultBalance,
                        beneficiary: data.beneficiary,
                        ripCount: data.ripCount,
                        lastPulse,
                        timeoutSeconds,
                        isDead: data.isDead,
                        deathTime,
                        expiredSeconds: Math.max(0, expiredSeconds),
                        isSelf,
                    };

                    // 分类账户
                    if (isSelf && data.isDead) {
                        selfDead = target;
                    } else if (data.isDead) {
                        dead.push(target);
                    } else if (expiredSeconds > 0) {
                        dying.push(target);
                    }
                } catch (e) {
                    console.error("Error parsing account:", e);
                }
            }

            // 按遗产金额排序
            dying.sort((a, b) => b.vaultBalance - a.vaultBalance);
            dead.sort((a, b) => b.vaultBalance - a.vaultBalance);

            setDyingUsers(dying);
            setDeadUsers(dead);
            setSelfDeadProfile(selfDead);
        } catch (error) {
            console.error("Failed to fetch targets:", error);
        } finally {
            setIsLoading(false);
        }
    }, [program, connection, publicKey]);

    useEffect(() => {
        fetchTargets();
        const interval = setInterval(fetchTargets, 30000); // 30秒刷新一次，避免 429
        return () => clearInterval(interval);
    }, [fetchTargets]);

    // 超度操作
    const handleFlatline = async (user: TargetUser) => {
        if (!publicKey || !program) return;

        setProcessingAddress(user.address.toString());

        try {
            const [deathRecordPDA] = getDeathRecordPDA(user.address);

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .flatline()
                .accounts({
                    caller: publicKey,
                    userProfile: user.profilePDA,
                    vault: user.vaultPDA,
                    beneficiary: user.beneficiary,
                    deathRecord: deathRecordPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            await fetchTargets();
            alert(`⚰️ 成功超度 ${user.address.toString().slice(0, 8)}...！现在可以捡漏了！`);
        } catch (error) {
            console.error("Flatline failed:", error);
            alert("超度失败: " + (error instanceof Error ? error.message : "未知错误"));
        } finally {
            setProcessingAddress(null);
        }
    };

    // 捡漏操作
    const handleLoot = async (user: TargetUser) => {
        if (!publicKey || !program) return;

        setProcessingAddress(user.address.toString());

        try {
            const [graveyardPDA] = getGraveyardPDA();
            const [deathRecordPDA] = getDeathRecordPDA(user.address);

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .loot()
                .accounts({
                    looter: publicKey,
                    userProfile: user.profilePDA,
                    vault: user.vaultPDA,
                    graveyard: graveyardPDA,
                    deathRecord: deathRecordPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            const reward = (user.vaultBalance * 0.5 / LAMPORTS_PER_SOL).toFixed(4);
            await fetchTargets();

            if (user.isSelf) {
                alert(`🙏 自救成功！取回 ${reward} SOL！`);
            } else {
                alert(`🦅 大丰收！获得 ${reward} SOL！`);
            }
        } catch (error) {
            console.error("Loot failed:", error);
            alert("捡漏失败: " + (error instanceof Error ? error.message : "未知错误"));
        } finally {
            setProcessingAddress(null);
        }
    };

    // 一键超度+捡漏
    const handleFlatlineAndLoot = async (user: TargetUser) => {
        if (!publicKey || !program) return;

        setProcessingAddress(user.address.toString());

        try {
            const [deathRecordPDA] = getDeathRecordPDA(user.address);
            const [graveyardPDA] = getGraveyardPDA();

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .flatline()
                .accounts({
                    caller: publicKey,
                    userProfile: user.profilePDA,
                    vault: user.vaultPDA,
                    beneficiary: user.beneficiary,
                    deathRecord: deathRecordPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .loot()
                .accounts({
                    looter: publicKey,
                    userProfile: user.profilePDA,
                    vault: user.vaultPDA,
                    graveyard: graveyardPDA,
                    deathRecord: deathRecordPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            const reward = (user.vaultBalance * 0.5 / LAMPORTS_PER_SOL).toFixed(4);
            await fetchTargets();
            alert(`🦅 完美狩猎！超度 + 捡漏成功！获得 ${reward} SOL！`);
        } catch (error) {
            console.error("Hunt failed:", error);
            alert("狩猎失败: " + (error instanceof Error ? error.message : "未知错误"));
        } finally {
            setProcessingAddress(null);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}秒`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
        return `${Math.floor(seconds / 86400)}天`;
    };

    // V3: 计算自救冷却
    const now = Math.floor(Date.now() / 1000);
    const selfRescueCooldown = selfDeadProfile
        ? Math.max(0, selfDeadProfile.deathTime + THREE_DAYS_SECONDS - now)
        : 0;
    const canSelfRescue = selfDeadProfile && selfRescueCooldown <= 0 && selfDeadProfile.vaultBalance > 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 页面标题 */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-dead)] bg-clip-text text-transparent">
                        🦅 秃鹫狩猎场
                    </span>
                </h1>
                <p className="text-[var(--text-secondary)]">
                    寻找超时的灵魂，超度他们，继承他们的遗产
                </p>
            </div>

            {/* V3: 自救卡片（如果自己死亡了） */}
            {selfDeadProfile && (
                <section className="mb-8">
                    <div className="card border-2 border-[var(--color-rip)] bg-gradient-to-r from-[#bf5af215] to-[#ff2d5515]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">🙏</span>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--color-rip)]">孤魂自救</h2>
                                <p className="text-sm text-[var(--text-secondary)]">你已死亡，可以尝试自救取回部分遗产</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <p className="text-2xl font-bold text-[var(--color-loot)]">
                                    {(selfDeadProfile.vaultBalance / LAMPORTS_PER_SOL).toFixed(4)}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">Vault 余额 (SOL)</p>
                            </div>
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <p className="text-2xl font-bold text-[var(--color-alive)]">
                                    {(selfDeadProfile.vaultBalance * 0.5 / LAMPORTS_PER_SOL).toFixed(4)}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">可取回 (SOL)</p>
                            </div>
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <p className={`text-2xl font-bold ${selfRescueCooldown > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-alive)]"}`}>
                                    {selfRescueCooldown > 0 ? formatDuration(selfRescueCooldown) : "可自救"}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">冷却期</p>
                            </div>
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <p className="text-2xl font-bold text-[var(--color-rip)]">
                                    {selfDeadProfile.ripCount}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">收到 RIP</p>
                            </div>
                        </div>

                        {canSelfRescue ? (
                            <button
                                onClick={() => handleLoot(selfDeadProfile)}
                                disabled={processingAddress === selfDeadProfile.address.toString()}
                                className={`w-full py-3 rounded-xl font-semibold transition-all
                  bg-gradient-to-r from-[var(--color-rip)] to-[var(--color-alive)] text-white
                  ${processingAddress === selfDeadProfile.address.toString() ? "opacity-50" : "hover:shadow-[0_0_20px_#bf5af266]"}
                `}
                            >
                                {processingAddress === selfDeadProfile.address.toString() ? "自救中..." : "🙏 自救 - 取回 50% 遗产"}
                            </button>
                        ) : selfRescueCooldown > 0 ? (
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl">
                                <p className="text-[var(--color-warning)]">
                                    ⏱️ 死亡 3 天后才能自救，还需等待 {formatDuration(selfRescueCooldown)}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-xl">
                                <p className="text-[var(--text-muted)]">Vault 余额为空，无法自救</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center">
                        <div className="text-4xl animate-pulse">🔍</div>
                        <p className="mt-4 text-[var(--text-secondary)]">扫描猎物中...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 濒死名单 - 可超度 */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">⚰️</span>
                            <h2 className="text-xl font-semibold">濒死名单</h2>
                            <span className="badge badge-warning text-sm">可超度+捡漏</span>
                        </div>

                        {dyingUsers.length === 0 ? (
                            <div className="card text-center py-12">
                                <p className="text-[var(--text-secondary)]">暂无超时用户，大家都还活蹦乱跳的</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dyingUsers.map((user) => (
                                    <div key={user.address.toString()} className="card border-[var(--color-warning)]">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-mono text-sm">
                                                {user.address.toString().slice(0, 6)}...{user.address.toString().slice(-4)}
                                            </span>
                                            <span className="badge badge-warning text-xs">
                                                超时 {formatDuration(user.expiredSeconds)}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">💰 遗产价值</span>
                                                <span className="font-bold text-[var(--color-loot)]">
                                                    {(user.vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">🦅 你能获得</span>
                                                <span className="font-bold text-[var(--color-alive)]">
                                                    {(user.vaultBalance * 0.5 / LAMPORTS_PER_SOL).toFixed(4)} SOL
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">🕯️ RIP 数</span>
                                                <span className="text-[var(--color-rip)]">{user.ripCount}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleFlatlineAndLoot(user)}
                                            disabled={!publicKey || processingAddress === user.address.toString()}
                                            className={`w-full py-3 rounded-xl font-semibold transition-all
                        bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-loot)] text-black
                        ${processingAddress === user.address.toString() ? "opacity-50" : "hover:shadow-[0_0_20px_#ff9f0a66]"}
                      `}
                                        >
                                            {processingAddress === user.address.toString() ? "狩猎中..." : "⚰️🦅 超度 + 捡漏"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 最近死亡记录 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🪦</span>
                            <h2 className="text-xl font-semibold">最近死亡</h2>
                            <span className="badge badge-dead text-sm">历史记录</span>
                        </div>

                        {deadUsers.length === 0 ? (
                            <div className="card text-center py-8">
                                <p className="text-[var(--text-secondary)]">暂无死亡记录</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deadUsers.map((user) => (
                                    <div key={user.address.toString()} className="card bg-[var(--bg-secondary)] border border-[var(--color-dead)]/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">⚰️</span>
                                                <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                    {user.address.toString().slice(0, 6)}...{user.address.toString().slice(-4)}
                                                </span>
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="text-[var(--color-rip)]">🕯️ {user.ripCount} RIP</p>
                                                {user.vaultBalance > 0 && (
                                                    <button
                                                        onClick={() => handleLoot(user)}
                                                        disabled={!publicKey || processingAddress === user.address.toString()}
                                                        className="text-xs text-[var(--color-loot)] hover:underline mt-1"
                                                    >
                                                        {processingAddress === user.address.toString() ? "捡漏中..." : `🦅 捡漏 ${(user.vaultBalance / LAMPORTS_PER_SOL).toFixed(2)} SOL`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 空状态 */}
                    {dyingUsers.length === 0 && deadUsers.length === 0 && !selfDeadProfile && (
                        <div className="text-center py-12 mt-8">
                            <div className="text-6xl mb-4">😇</div>
                            <p className="text-xl text-[var(--text-secondary)]">
                                今天风平浪静，没有猎物
                            </p>
                            <p className="text-sm text-[var(--text-muted)] mt-2">
                                所有人都按时签到了...暂时
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* 说明 */}
            <div className="mt-12 card bg-[var(--bg-secondary)]">
                <h3 className="text-lg font-semibold mb-4">🎯 狩猎指南</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <h4 className="font-medium text-[var(--color-warning)] mb-2">⚰️ 濒死用户</h4>
                        <p className="text-[var(--text-secondary)]">
                            已超时但还未被正式宣判死亡。一键"超度+捡漏"获得 50% 遗产！
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-[var(--color-dead)] mb-2">🪦 已死用户</h4>
                        <p className="text-[var(--text-secondary)]">
                            已被宣判死亡，点击"捡漏"即可获得 50% 遗产。
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-[var(--color-rip)] mb-2">🙏 自救机制</h4>
                        <p className="text-[var(--text-secondary)]">
                            死亡 3 天后无人捡漏，可以自己 Loot 取回 50% 遗产。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
