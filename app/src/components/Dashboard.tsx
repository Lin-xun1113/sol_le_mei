"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CountdownTimer } from "./CountdownTimer";
import { HeartbeatButton } from "./HeartbeatButton";
import { VaultCard } from "./VaultCard";
import { ShareBlink } from "./ShareBlink";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProgram, getUserProfilePDA, getVaultPDA } from "@/hooks/useProgram";

// V3: 冷却期常量
const THREE_DAYS_SECONDS = 3 * 24 * 60 * 60;
const MIN_VAULT_FOR_RESURRECT = 0.01 * LAMPORTS_PER_SOL;

export function Dashboard() {
    const { publicKey } = useWallet();
    const { program } = useProgram();
    const {
        isLoading,
        profile,
        vaultBalance,
        timeRemaining,
        refetch
    } = useUserProfile();

    const [isResurrecting, setIsResurrecting] = useState(false);

    // V3: 计算复活冷却倒计时
    const now = Math.floor(Date.now() / 1000);
    const resurrectUnlockTime = profile ? profile.deathTime + THREE_DAYS_SECONDS : 0;
    const resurrectCooldown = profile?.isDead ? Math.max(0, resurrectUnlockTime - now) : 0;
    const canResurrect = profile?.isDead && resurrectCooldown <= 0 && vaultBalance >= MIN_VAULT_FOR_RESURRECT;

    // V3: 格式化冷却时间
    const formatCooldown = (seconds: number) => {
        if (seconds <= 0) return "可复活";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}天 ${hours}小时`;
        if (hours > 0) return `${hours}小时 ${mins}分钟`;
        return `${mins}分钟`;
    };

    // V3: 复活操作
    const handleResurrect = async () => {
        if (!publicKey || !program || !canResurrect) return;

        setIsResurrecting(true);
        try {
            const [userProfilePDA] = getUserProfilePDA(publicKey);
            const [vaultPDA] = getVaultPDA(publicKey);

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .resurrect()
                .accounts({
                    user: publicKey,
                    userProfile: userProfilePDA,
                    vault: vaultPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            alert("🎉 复活成功！开始新的一轮吧！");
            refetch();
        } catch (err) {
            console.error("Resurrect failed:", err);
            alert("复活失败: " + (err instanceof Error ? err.message : "未知错误"));
        } finally {
            setIsResurrecting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-4xl animate-pulse">💓</div>
                    <p className="mt-4 text-[var(--text-secondary)]">加载中...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <p className="text-[var(--text-secondary)]">无法加载用户数据</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 心电图装饰线 */}
            <div className="mb-8 overflow-hidden h-12 relative opacity-30">
                <svg viewBox="0 0 1200 50" className="w-[200%] h-full ecg-line">
                    <path
                        d="M0,25 L100,25 L110,25 L120,10 L130,40 L140,5 L150,45 L160,25 L200,25 L300,25 L310,25 L320,10 L330,40 L340,5 L350,45 L360,25 L400,25 L500,25 L510,25 L520,10 L530,40 L540,5 L550,45 L560,25 L600,25"
                        stroke="var(--color-alive)"
                        strokeWidth="2"
                        fill="none"
                    />
                </svg>
            </div>

            {/* 主卡片 - 生存状态 */}
            <div className="card mb-8">
                <div className="text-center mb-6">
                    {/* V3: 显示游戏轮次 */}
                    <div className="inline-block px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-sm mb-3">
                        🎮 第 <span className="font-bold text-[var(--color-rip)]">{profile.gameRound}</span> 轮
                    </div>

                    <h2 className="text-xl font-semibold mb-2">
                        {profile.isDead ? "💀 你已死亡" : "💓 生存状态"}
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        模式: {profile.mode === 0 ? "🛡️ 安全模式" : "🦅 吃席模式"}
                    </p>
                </div>

                <CountdownTimer
                    timeRemaining={timeRemaining}
                    timeoutSeconds={profile.timeoutSeconds}
                    isDead={profile.isDead}
                />

                {/* 签到按钮 - 存活时显示 */}
                {!profile.isDead && (
                    <div className="mt-8 flex justify-center">
                        <HeartbeatButton onSuccess={refetch} />
                    </div>
                )}

                {/* V3: 死亡消息 + 复活区域 */}
                {profile.isDead && (
                    <div className="mt-8">
                        {/* 冷却倒计时 */}
                        <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-xl">
                            <p className="text-[var(--color-dead)] text-lg mb-4">
                                安息吧，你的遗产正在等待被瓜分... 🪦
                            </p>

                            <div className="border-t border-[var(--border-default)] pt-4 mt-4">
                                <p className="text-sm text-[var(--text-secondary)] mb-2">
                                    ⏱️ 复活冷却期
                                </p>
                                <p className={`text-2xl font-bold ${resurrectCooldown > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-alive)]"}`}>
                                    {formatCooldown(resurrectCooldown)}
                                </p>

                                {resurrectCooldown <= 0 && (
                                    <div className="mt-4">
                                        {vaultBalance >= MIN_VAULT_FOR_RESURRECT ? (
                                            <button
                                                onClick={handleResurrect}
                                                disabled={isResurrecting}
                                                className={`btn-primary px-8 py-3 text-lg ${isResurrecting ? "opacity-50" : ""}`}
                                            >
                                                {isResurrecting ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="animate-spin">⏳</span> 复活中...
                                                    </span>
                                                ) : (
                                                    "🔄 复活 - 开始新一轮"
                                                )}
                                            </button>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-[var(--color-warning)] text-sm mb-2">
                                                    需要 Vault ≥ 0.01 SOL 才能复活
                                                </p>
                                                <p className="text-[var(--text-muted)] text-xs">
                                                    当前余额: {(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
                                                </p>
                                            </div>
                                        )}

                                        {/* V3: 复活警告 */}
                                        <p className="text-xs text-[var(--text-muted)] mt-3">
                                            ⚠️ 复活后 RIP 数据将清零，进入新一轮游戏
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 下方信息网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vault 卡片 */}
                <VaultCard balance={vaultBalance} isDead={profile.isDead} onSuccess={refetch} />

                {/* RIP 统计卡片 */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🕯️</span>
                        <h3 className="text-lg font-semibold">RIP 统计</h3>
                        <span className="text-xs text-[var(--text-muted)]">(本轮)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center py-4">
                            <p className="text-3xl font-bold text-[var(--color-rip)]">
                                {profile.ripCount}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                收到的 RIP
                            </p>
                        </div>
                        <div className="text-center py-4">
                            <p className="text-3xl font-bold text-[var(--color-alive)]">
                                {(profile.ripEarnings / 1e9).toFixed(4)}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                RIP 收入 (SOL)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 用户信息 */}
            <div className="mt-8 card">
                <h3 className="text-lg font-semibold mb-4">📋 账户信息</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">游戏轮次</span>
                        <span className="font-mono">第 {profile.gameRound} 轮</span>
                    </div>
                    {profile.mode === 0 && (
                        <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">受益人</span>
                            <span className="font-mono">
                                {profile.beneficiary.toString().slice(0, 4)}...
                                {profile.beneficiary.toString().slice(-4)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">超时时间</span>
                        <span className="font-mono">
                            {profile.timeoutSeconds >= 86400
                                ? `${Math.floor(profile.timeoutSeconds / 86400)} 天`
                                : profile.timeoutSeconds >= 3600
                                    ? `${Math.floor(profile.timeoutSeconds / 3600)} 小时`
                                    : `${Math.floor(profile.timeoutSeconds / 60)} 分钟`
                            }
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">上次签到</span>
                        <span className="font-mono">
                            {new Date(profile.lastPulse * 1000).toLocaleString("zh-CN")}
                        </span>
                    </div>
                </div>
            </div>

            {/* 分享 Blink */}
            <div className="mt-8">
                <ShareBlink />
            </div>
        </div>
    );
}
