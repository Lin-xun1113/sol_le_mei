"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// 动态导入钱包按钮，禁用 SSR 以避免 Hydration 错误
const WalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export function Navbar() {
    const { connected } = useWallet();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">💀</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-alive)] to-[var(--color-rip)] bg-clip-text text-transparent">
                            Sol了没
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {connected && (
                            <>
                                <Link
                                    href="/"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/hunt"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                                >
                                    <span>🦅</span> 狩猎场
                                </Link>
                                <Link
                                    href="/rip"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                                >
                                    <span>🕯️</span> RIP
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Wallet Button */}
                    <div className="wallet-adapter-button-wrapper">
                        <WalletMultiButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
