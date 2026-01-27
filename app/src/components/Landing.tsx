"use client";

import dynamic from "next/dynamic";

// 动态导入 WalletMultiButton 避免 SSR Hydration 问题
const WalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
    { ssr: false }
);

export function Landing() {
    return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center px-4">
            {/* Hero Section */}
            <div className="text-center max-w-3xl">
                {/* Logo */}
                <div className="text-8xl mb-6 animate-pulse">💀</div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-[var(--color-alive)] via-[var(--color-rip)] to-[var(--color-dead)] bg-clip-text text-transparent">
                        Sol了没
                    </span>
                </h1>

                {/* Tagline */}
                <p className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-4">
                    链上死亡开关
                </p>

                {/* Description */}
                <p className="text-xl text-[var(--color-alive)] mb-8 font-medium">
                    &quot;活着天天签到，死了全网吃席！&quot;
                </p>

                <p className="text-[var(--text-secondary)] mb-12 max-w-xl mx-auto">
                    基于 Solana 区块链的&quot;死亡开关&quot;应用。定期签到证明你还活着，
                    如果你挂了，你的遗产将按照你的遗嘱执行...或者被秃鹫们瓜分！
                </p>

                {/* CTA Button */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <WalletMultiButton />
                </div>
            </div>

            {/* Features */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                <div className="card text-center">
                    <div className="text-4xl mb-4">💓</div>
                    <h3 className="text-lg font-semibold mb-2">链上心跳</h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                        定期签到证明你还活着，一键续命
                    </p>
                </div>

                <div className="card text-center">
                    <div className="text-4xl mb-4">🦅</div>
                    <h3 className="text-lg font-semibold mb-2">吃席模式</h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                        断签后资金进入公共池，任何人可捡漏！
                    </p>
                </div>

                <div className="card text-center">
                    <div className="text-4xl mb-4">🕯️</div>
                    <h3 className="text-lg font-semibold mb-2">RIP 社交</h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                        给朋友发送悼念，参与奖励池分配
                    </p>
                </div>
            </div>

            {/* Mode Explanation */}
            <div className="mt-16 max-w-4xl w-full">
                <h2 className="text-2xl font-bold text-center mb-8">选择你的命运</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card border-[var(--color-alive)]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">🛡️</span>
                            <h3 className="text-xl font-semibold">安全模式</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">
                            如果你断签，资金将 100% 转给你的受益人。
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                            适合: 资产保全、遗嘱规划
                        </p>
                    </div>

                    <div className="card border-[var(--color-dead)]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">🦅</span>
                            <h3 className="text-xl font-semibold">吃席模式</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">
                            如果你断签，50% 被捡漏，50% 进入公共池！
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                            适合: Degen 玩家、刺激爱好者
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 text-center text-[var(--text-muted)] text-sm">
                <p>Built on Solana 🌊 | Hackathon Project</p>
            </div>
        </div>
    );
}
