"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface ShareBlinkProps {
    userAddress?: string;
}

export function ShareBlink({ userAddress }: ShareBlinkProps) {
    const { publicKey } = useWallet();
    const [copied, setCopied] = useState<string | null>(null);

    const baseUrl = typeof window !== "undefined"
        ? window.location.origin
        : "https://your-domain.com";

    const address = userAddress || publicKey?.toString() || "";

    const shareOptions = [
        {
            id: "heartbeat",
            emoji: "💓",
            title: "签到续命",
            description: "分享你的签到链接，让别人见证你还活着",
            tweetText: "我今天还活着！💓 每日签到续命中... #Sol了没 #Solana",
            blinkUrl: `${baseUrl}/api/actions/heartbeat`,
            color: "from-pink-500 to-red-500",
        },
        {
            id: "rip",
            emoji: "🕯️",
            title: "求点蜡烛",
            description: "分享链接让别人为你点蜡烛祈福",
            tweetText: `为我点蜡烛续命吧！🕯️ 如果我死了你能分遗产... #Sol了没 #Solana`,
            blinkUrl: `${baseUrl}/api/actions/rip?target=${address}`,
            color: "from-purple-500 to-indigo-500",
            requiresAddress: true,
        },
        {
            id: "hunter",
            emoji: "🦅",
            title: "秃鹫召集",
            description: "邀请朋友来狩猎场捡漏",
            tweetText: "🦅 来 Sol了没 狩猎场吃席！发现即将断签的韭菜，分遗产！ #Sol了没 #Solana",
            blinkUrl: `${baseUrl}/api/actions/loot`,
            color: "from-yellow-500 to-orange-500",
        },
    ];

    const shareToX = (option: typeof shareOptions[0]) => {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            option.tweetText
        )}&url=${encodeURIComponent(option.blinkUrl)}`;
        window.open(tweetUrl, "_blank", "width=550,height=450");
    };

    const copyBlinkUrl = async (option: typeof shareOptions[0]) => {
        await navigator.clipboard.writeText(option.blinkUrl);
        setCopied(option.id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📢</span>
                <h3 className="text-lg font-semibold">分享到 X (Twitter)</h3>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
                发布 Blink 链接到 X，让使用 Phantom 钱包的朋友可以一键交互！
            </p>

            <div className="space-y-4">
                {shareOptions.map((option) => {
                    const isDisabled = option.requiresAddress && !address;

                    return (
                        <div
                            key={option.id}
                            className={`p-4 rounded-xl border transition-all ${isDisabled
                                    ? "border-[var(--border)] opacity-50"
                                    : "border-[var(--border)] hover:border-[var(--color-alive)]"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{option.emoji}</span>
                                    <div>
                                        <h4 className="font-semibold">{option.title}</h4>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyBlinkUrl(option)}
                                        disabled={isDisabled}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="复制 Blink URL"
                                    >
                                        {copied === option.id ? "✅ 已复制" : "📋 复制"}
                                    </button>
                                    <button
                                        onClick={() => shareToX(option)}
                                        disabled={isDisabled}
                                        className={`px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r ${option.color} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        分享到 𝕏
                                    </button>
                                </div>
                            </div>

                            {/* Preview URL */}
                            <div className="mt-3 p-2 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
                                <code className="text-xs text-[var(--text-muted)] break-all">
                                    {isDisabled ? "需要连接钱包" : option.blinkUrl}
                                </code>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 使用提示 */}
            <div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <h4 className="font-semibold text-sm mb-2">💡 如何使用 Blinks？</h4>
                <ol className="text-xs text-[var(--text-secondary)] space-y-1">
                    <li>1. 点击"分享到 𝕏"发布推文</li>
                    <li>2. 使用 Phantom 钱包浏览器或 Dialect 扩展查看推文</li>
                    <li>3. 点击推文中的交互按钮即可直接执行链上操作！</li>
                </ol>
            </div>
        </div>
    );
}
