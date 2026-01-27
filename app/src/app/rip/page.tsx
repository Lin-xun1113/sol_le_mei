"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useProgram, getUserProfilePDA, getVaultPDA, getRipRecordPDA, getGraveyardPDA } from "@/hooks/useProgram";
import { BN } from "@coral-xyz/anchor";

interface TargetInfo {
    isRegistered: boolean;
    isDead: boolean;
    ripCount: number;
    timeRemaining: number;
    gameRound: number;   // V3: 游戏轮次
}

// V2: RIP 费用常量
const RIP_COST_PER_UNIT = 0.001; // 0.001 SOL per RIP

export default function RipPage() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { program } = useProgram();

    const [targetAddress, setTargetAddress] = useState("");
    const [ripAmount, setRipAmount] = useState(1); // 🆕 V2: RIP 数量
    const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
    const [isQuerying, setIsQuerying] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleQuery = async () => {
        if (!program) return;

        setIsQuerying(true);
        setError("");
        setTargetInfo(null);

        try {
            const targetPubkey = new PublicKey(targetAddress);
            const [targetProfilePDA] = getUserProfilePDA(targetPubkey);

            const accountInfo = await connection.getAccountInfo(targetProfilePDA);

            if (!accountInfo) {
                setTargetInfo({ isRegistered: false, isDead: false, ripCount: 0, timeRemaining: 0, gameRound: 0 });
                return;
            }

            const profileData = await (program.account as Record<string, {
                fetch: (pda: PublicKey) => Promise<{
                    lastPulse: BN;
                    timeoutSeconds: BN;
                    isDead: boolean;
                    ripCount: number;
                    gameRound: BN;  // V3
                }>
            }>).userProfile.fetch(targetProfilePDA);

            const now = Math.floor(Date.now() / 1000);
            const deadline = profileData.lastPulse.toNumber() + profileData.timeoutSeconds.toNumber();
            const timeRemaining = Math.max(0, deadline - now);

            setTargetInfo({
                isRegistered: true,
                isDead: profileData.isDead,
                ripCount: profileData.ripCount,
                timeRemaining,
                gameRound: profileData.gameRound?.toNumber() || 1,  // V3
            });
        } catch (e) {
            setError("无效的地址或查询失败");
            console.error(e);
        } finally {
            setIsQuerying(false);
        }
    };

    // 🆕 V2: 更新的 sendRip 需要 rip_amount 参数和额外账户
    const handleSendRip = async () => {
        if (!publicKey || !program || !targetAddress) return;

        setIsSending(true);
        setError("");
        setSuccess(false);

        try {
            const targetPubkey = new PublicKey(targetAddress);

            if (targetPubkey.equals(publicKey)) {
                setError("不能给自己发 RIP 哦，臭不要脸的！");
                setIsSending(false);
                return;
            }

            const [targetProfilePDA] = getUserProfilePDA(targetPubkey);
            const [targetVaultPDA] = getVaultPDA(targetPubkey);
            const [ripRecordPDA] = getRipRecordPDA(publicKey, targetPubkey);
            const [graveyardPDA] = getGraveyardPDA();

            // V2: sendRip 需要 rip_amount 参数
            await (program.methods as Record<string, (amount: number) => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .sendRip(ripAmount)
                .accounts({
                    sender: publicKey,
                    targetProfile: targetProfilePDA,
                    targetOwner: targetPubkey,
                    targetVault: targetVaultPDA,  // 🆕 V2
                    ripRecord: ripRecordPDA,
                    graveyard: graveyardPDA,      // 🆕 V2
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setSuccess(true);
            // 刷新目标信息
            handleQuery();
        } catch (e) {
            console.error("Send RIP failed:", e);
            setError(e instanceof Error ? e.message : "发送失败");
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "已超时";
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}时 ${mins}分 ${secs}秒`;
    };

    const totalCost = ripAmount * RIP_COST_PER_UNIT;

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-2">🕯️ 发送 RIP</h1>
                <p className="text-[var(--text-secondary)]">
                    为你的朋友祈祷续命，参与奖励池分配
                </p>
            </div>

            <div className="card">
                {/* 地址输入 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        目标用户钱包地址
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="输入 Solana 钱包地址"
                            value={targetAddress}
                            onChange={(e) => {
                                setTargetAddress(e.target.value);
                                setTargetInfo(null);
                                setSuccess(false);
                            }}
                            className="input flex-1 font-mono text-sm"
                        />
                        <button
                            onClick={handleQuery}
                            disabled={isQuerying || !targetAddress}
                            className="btn-secondary px-6"
                        >
                            {isQuerying ? "查询中..." : "查询"}
                        </button>
                    </div>
                </div>

                {/* 🆕 V2: RIP 数量选择 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        🕯️ RIP 数量
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={ripAmount}
                            onChange={(e) => setRipAmount(Number(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-2xl font-bold text-[var(--color-rip)] min-w-[60px] text-right">
                            {ripAmount}
                        </span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">
                            费用: {totalCost.toFixed(3)} SOL
                        </span>
                        <span className="text-[var(--text-muted)]">
                            50% 给目标 / 50% 给项目方
                        </span>
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mb-6 p-4 bg-[#ff2d5522] border border-[var(--color-dead)] rounded-xl">
                        <p className="text-[var(--color-dead)] text-sm">{error}</p>
                    </div>
                )}

                {/* 成功提示 */}
                {success && (
                    <div className="mb-6 p-4 bg-[#00ff8822] border border-[var(--color-alive)] rounded-xl">
                        <p className="text-[var(--color-alive)] text-sm">
                            🕯️ 成功发送 {ripAmount} 个 RIP！花费 {totalCost.toFixed(3)} SOL
                        </p>
                    </div>
                )}

                {/* 目标用户信息 */}
                {targetInfo && (
                    <div className="mb-6">
                        {!targetInfo.isRegistered ? (
                            <div className="text-center py-8 text-[var(--text-secondary)]">
                                <div className="text-4xl mb-2">❓</div>
                                <p>该用户未注册 Sol了没</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                                <div className="text-center mb-4">
                                    {targetInfo.isDead ? (
                                        <>
                                            <span className="badge badge-dead">💀 已死亡</span>
                                            <p className="text-sm text-[var(--text-muted)] mt-2">
                                                无法给死人发 RIP
                                            </p>
                                        </>
                                    ) : (
                                        <span className="badge badge-alive">💓 存活中</span>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm">
                                    {/* V3: 显示游戏轮次 */}
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">🎮 当前轮次</span>
                                        <span className="font-bold text-[var(--color-rip)]">第 {targetInfo.gameRound} 轮</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">⏱️ 剩余时间</span>
                                        <span className={targetInfo.timeRemaining <= 3600 ? "text-[var(--color-warning)]" : ""}>
                                            {formatTime(targetInfo.timeRemaining)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">🕯️ 本轮收到 RIP</span>
                                        <span className="text-[var(--color-rip)]">{targetInfo.ripCount} 次</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 发送按钮 */}
                {targetInfo?.isRegistered && !targetInfo.isDead && (
                    <button
                        onClick={handleSendRip}
                        disabled={isSending || !publicKey}
                        className={`w-full py-4 text-lg rounded-xl bg-gradient-to-r from-[var(--color-rip)] to-[#9333ea] text-white font-semibold transition-all ${isSending ? "opacity-50" : "hover:shadow-[0_0_30px_#bf5af266]"
                            }`}
                    >
                        {isSending ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span> 发送中...
                            </span>
                        ) : (
                            `🕯️ 发送 ${ripAmount} RIP - ${totalCost.toFixed(3)} SOL`
                        )}
                    </button>
                )}

                {/* 提示 - V3 更新 */}
                <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <h4 className="text-sm font-medium mb-2">💡 V3 规则</h4>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1">
                        <li>• 每个 RIP 需支付 0.001 SOL</li>
                        <li>• 50% 存入目标用户的 Vault / 50% 归项目方</li>
                        <li>• 目标死亡后，按 RIP 比例领取奖励池奖励</li>
                        <li className="text-[var(--color-warning)]">• ⚠️ RIP 绑定轮次！目标复活后，上轮 RIP 失效</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
