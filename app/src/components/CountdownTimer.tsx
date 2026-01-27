"use client";

import { useEffect, useState } from "react";

interface Props {
    timeRemaining: number; // seconds
    timeoutSeconds: number;
    isDead?: boolean;
}

export function CountdownTimer({ timeRemaining, timeoutSeconds, isDead }: Props) {
    const [displayTime, setDisplayTime] = useState(timeRemaining);

    useEffect(() => {
        setDisplayTime(timeRemaining);
    }, [timeRemaining]);

    // 格式化时间
    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "00:00:00";

        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // 计算百分比
    const percent = timeoutSeconds > 0 ? (displayTime / timeoutSeconds) * 100 : 0;

    // 判断状态
    const isExpired = displayTime <= 0 && !isDead;  // 已超时但未被判定死亡
    const isWarning = percent <= 30 && percent > 10 && !isExpired;
    const isDanger = percent <= 10 && percent > 0 && !isExpired;

    // 样式类
    const timeClass = isDead
        ? "countdown-dead"
        : isExpired
            ? "countdown-dead"
            : isDanger || isWarning
                ? "countdown-warning"
                : "";

    const progressClass = isDead || isExpired
        ? "progress-fill-danger"
        : isDanger
            ? "progress-fill-danger"
            : isWarning
                ? "progress-fill-warning"
                : "";

    return (
        <div className="text-center">
            {/* 状态标签 */}
            <div className="mb-4">
                {isDead ? (
                    <span className="badge badge-dead">
                        💀 已死亡
                    </span>
                ) : isExpired ? (
                    <span className="badge badge-dead">
                        ⚰️ 已超时 - 等待死亡判定
                    </span>
                ) : isDanger ? (
                    <span className="badge badge-warning">
                        ⚠️ 危险！即将超时
                    </span>
                ) : isWarning ? (
                    <span className="badge badge-warning">
                        ⏰ 注意！时间不多了
                    </span>
                ) : (
                    <span className="badge badge-alive">
                        💓 存活中
                    </span>
                )}
            </div>

            {/* 倒计时数字 */}
            <div className={`countdown ${timeClass}`}>
                {isDead ? (
                    "💀 FLATLINE 💀"
                ) : isExpired ? (
                    "⚰️ 超时！可被捡漏 ⚰️"
                ) : (
                    formatTime(displayTime)
                )}
            </div>

            {/* 超时提示 */}
            {isExpired && !isDead && (
                <div className="mt-4 p-4 bg-[#ff2d5522] border border-[var(--color-dead)] rounded-xl">
                    <p className="text-[var(--color-dead)] text-sm">
                        ⚠️ 你已超时！任何人都可以调用 <code className="font-mono">flatline</code> 宣判你死亡！
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mt-2">
                        在被判定死亡之前，你仍可签到续命（如果足够幸运的话）
                    </p>
                </div>
            )}

            {/* 进度条 */}
            {!isDead && !isExpired && (
                <div className="mt-6 w-full max-w-md mx-auto">
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${progressClass}`}
                            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        距离签到截止还剩 <span className="font-mono">{percent.toFixed(1)}%</span>
                    </p>
                </div>
            )}
        </div>
    );
}
