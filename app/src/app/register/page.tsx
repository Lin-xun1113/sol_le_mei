"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram, getUserProfilePDA, getVaultPDA } from "@/hooks/useProgram";

const TIMEOUT_OPTIONS = [
    { label: "1 分钟 (测试)", value: 60 },
    { label: "1 小时", value: 3600 },
    { label: "24 小时", value: 86400 },
    { label: "48 小时", value: 172800 },
    { label: "7 天", value: 604800 },
];

// V3: 零地址，用于 Feast 模式
const ZERO_ADDRESS = new PublicKey("11111111111111111111111111111111");

export default function RegisterPage() {
    const router = useRouter();
    const { publicKey } = useWallet();
    const { program } = useProgram();

    const [timeoutSeconds, setTimeoutSeconds] = useState(86400);
    const [mode, setMode] = useState<0 | 1>(1); // Default to Feast mode
    const [beneficiary, setBeneficiary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // V3: Feast 模式自动使用当前用户地址（避开 SystemProgramId 的 mut 限制）
    useEffect(() => {
        if (mode === 1 && publicKey) {
            setBeneficiary(publicKey.toString());
        } else if (mode === 0) {
            setBeneficiary("");
        }
    }, [mode, publicKey]);

    const handleRegister = async () => {
        if (!publicKey || !program) {
            setError("请先连接钱包");
            return;
        }

        // 验证受益人地址
        let beneficiaryPubkey: PublicKey;
        try {
            beneficiaryPubkey = new PublicKey(beneficiary);
        } catch {
            setError("受益人地址格式无效");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const [userProfilePDA] = getUserProfilePDA(publicKey);
            const [vaultPDA] = getVaultPDA(publicKey);

            await (program.methods as Record<string, (timeout: BN, mode: number) => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .register(new BN(timeoutSeconds), mode)
                .accounts({
                    user: publicKey,
                    userProfile: userProfilePDA,
                    vault: vaultPDA,
                    beneficiary: beneficiaryPubkey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            // 注册成功，跳转到首页
            router.push("/");
        } catch (err) {
            console.error("Registration failed:", err);
            setError(err instanceof Error ? err.message : "注册失败");
        } finally {
            setIsLoading(false);
        }
    };

    if (!publicKey) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center">
                    <p className="text-[var(--text-secondary)]">请先连接钱包</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-2">🪦 注册 Sol了没</h1>
                <p className="text-[var(--text-secondary)]">
                    设置你的死亡开关参数
                </p>
            </div>

            <div className="card">
                {/* V3: 模式锁定警告 - 置顶显示 */}
                <div className="mb-6 p-4 bg-[#ff2d5522] border-2 border-[var(--color-dead)] rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <p className="font-bold text-[var(--color-dead)]">模式永久锁定</p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                注册后<strong>无法更改模式</strong>，请仔细阅读后再选择！
                            </p>
                        </div>
                    </div>
                </div>

                {/* 超时时间 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        ⏱️ 签到超时时间
                    </label>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                        超过此时间未签到，将被判定为"死亡"
                    </p>
                    <select
                        value={timeoutSeconds}
                        onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                        className="input"
                    >
                        {TIMEOUT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 模式选择 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                        🎮 选择模式 <span className="text-[var(--color-dead)]">(不可更改)</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setMode(0)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 0
                                ? "border-[var(--color-alive)] bg-[#00ff8811]"
                                : "border-[var(--border-default)] hover:border-[var(--color-alive)]"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🛡️</span>
                                <span className="font-semibold">安全模式</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">
                                死后资金 100% 转给受益人
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode(1)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 1
                                ? "border-[var(--color-dead)] bg-[#ff2d5511]"
                                : "border-[var(--border-default)] hover:border-[var(--color-dead)]"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🦅</span>
                                <span className="font-semibold">吃席模式</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">
                                死后 50% 被捡漏，50% 进公共池
                            </p>
                        </button>
                    </div>
                </div>

                {/* 受益人地址 - 仅 Safeguard 模式显示 */}
                {mode === 0 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            👤 受益人钱包地址 <span className="text-[var(--color-dead)]">*</span>
                        </label>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                            安全模式下，死后资金将全部转给此地址
                        </p>
                        <input
                            type="text"
                            placeholder="输入 Solana 钱包地址"
                            value={beneficiary}
                            onChange={(e) => setBeneficiary(e.target.value)}
                            className="input font-mono text-sm"
                        />
                    </div>
                )}

                {/* 错误提示 */}
                {error && (
                    <div className="mb-6 p-4 bg-[#ff2d5522] border border-[var(--color-dead)] rounded-xl">
                        <p className="text-[var(--color-dead)] text-sm">{error}</p>
                    </div>
                )}

                {/* 提交按钮 */}
                <button
                    onClick={handleRegister}
                    disabled={isLoading || (mode === 0 && !beneficiary)}
                    className={`btn-primary w-full text-lg py-4 ${isLoading || (mode === 0 && !beneficiary) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> 注册中...
                        </span>
                    ) : (
                        "🚀 确认注册"
                    )}
                </button>

                {/* 提示信息 */}
                <p className="mt-6 text-sm text-[var(--text-muted)] text-center">
                    注册需支付少量 Gas 费用 (~0.005 SOL)
                </p>
            </div>
        </div>
    );
}
