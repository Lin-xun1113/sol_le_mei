"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram, getVaultPDA, getUserProfilePDA } from "@/hooks/useProgram";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

interface Props {
    balance: number; // lamports
    onSuccess?: () => void;
}

export function VaultCard({ balance, onSuccess }: Props) {
    const { publicKey } = useWallet();
    const { program } = useProgram();
    const [showDeposit, setShowDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const balanceInSol = balance / LAMPORTS_PER_SOL;

    const handleDeposit = async () => {
        if (!publicKey || !program || !depositAmount) return;

        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("请输入有效金额");
            return;
        }

        setIsLoading(true);
        try {
            const [userProfilePDA] = getUserProfilePDA(publicKey);
            const [vaultPDA] = getVaultPDA(publicKey);
            const lamports = new BN(amount * LAMPORTS_PER_SOL);

            await (program.methods as Record<string, (amount: BN) => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .deposit(lamports)
                .accounts({
                    user: publicKey,
                    userProfile: userProfilePDA,
                    vault: vaultPDA,
                })
                .rpc();

            setShowDeposit(false);
            setDepositAmount("");
            onSuccess?.();
        } catch (error) {
            console.error("Deposit failed:", error);
            alert("存款失败: " + (error instanceof Error ? error.message : "未知错误"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-semibold">资金保险库</h3>
            </div>

            <div className="text-center py-4">
                <p className="text-4xl font-bold text-[var(--color-loot)]">
                    {balanceInSol.toFixed(4)} SOL
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    当前遗产价值
                </p>
            </div>

            {!showDeposit ? (
                <button
                    onClick={() => setShowDeposit(true)}
                    className="btn-secondary w-full mt-4"
                >
                    💵 存入资金
                </button>
            ) : (
                <div className="mt-4 space-y-3">
                    <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="输入 SOL 金额"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="input"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleDeposit}
                            disabled={isLoading}
                            className="btn-primary flex-1"
                        >
                            {isLoading ? "存入中..." : "确认存入"}
                        </button>
                        <button
                            onClick={() => {
                                setShowDeposit(false);
                                setDepositAmount("");
                            }}
                            className="btn-secondary"
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
