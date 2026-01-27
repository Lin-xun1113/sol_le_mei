"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Landing } from "@/components/Landing";
import { Dashboard } from "@/components/Dashboard";
import Link from "next/link";

export default function Home() {
  const { connected } = useWallet();
  const { isLoading, isRegistered } = useUserProfile();

  // 未连接钱包 - 显示 Landing
  if (!connected) {
    return <Landing />;
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="text-6xl animate-pulse">💓</div>
          <p className="mt-4 text-[var(--text-secondary)]">检查心跳中...</p>
        </div>
      </div>
    );
  }

  // 已连接但未注册 - 显示注册引导
  if (!isRegistered) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">👋</div>
          <h1 className="text-3xl font-bold mb-4">欢迎来到 Sol了没</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            你还没有注册。立即创建你的死亡开关，开始链上心跳之旅！
          </p>
          <Link href="/register" className="btn-primary inline-block px-8 py-4 text-lg">
            🚀 立即注册
          </Link>
        </div>
      </div>
    );
  }

  // 已注册 - 显示 Dashboard
  return <Dashboard />;
}
