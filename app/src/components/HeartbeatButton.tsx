"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram, getUserProfilePDA } from "@/hooks/useProgram";

interface Props {
    onSuccess?: () => void;
    disabled?: boolean;
}

export function HeartbeatButton({ onSuccess, disabled }: Props) {
    const { publicKey, signTransaction } = useWallet();
    const { program } = useProgram();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleHeartbeat = async () => {
        if (!publicKey || !program || !signTransaction) return;

        setIsLoading(true);
        try {
            const [userProfilePDA] = getUserProfilePDA(publicKey);

            await (program.methods as Record<string, () => { accounts: (accounts: Record<string, unknown>) => { rpc: () => Promise<string> } }>)
                .heartbeat()
                .accounts({
                    user: publicKey,
                    userProfile: userProfilePDA,
                })
                .rpc();

            // 显示成功动画
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            onSuccess?.();
        } catch (error) {
            console.error("Heartbeat failed:", error);
            alert("签到失败: " + (error instanceof Error ? error.message : "未知错误"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleHeartbeat}
                disabled={disabled || isLoading || !publicKey}
                className={`
          btn-primary text-xl px-12 py-4 
          ${!disabled && !isLoading ? "btn-heartbeat" : ""}
          ${isLoading ? "opacity-50 cursor-wait" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> 签到中...
                    </span>
                ) : showSuccess ? (
                    <span className="flex items-center gap-2">
                        ✅ 签到成功！
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        💓 签到续命
                    </span>
                )}
            </button>

            {/* 成功时的脉冲效果 */}
            {showSuccess && (
                <div className="absolute inset-0 rounded-xl animate-ping bg-[var(--color-alive)] opacity-30" />
            )}
        </div>
    );
}
