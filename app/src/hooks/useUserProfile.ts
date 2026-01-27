"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram, getUserProfilePDA, getVaultPDA } from "./useProgram";
import { BN } from "@coral-xyz/anchor";

export interface UserProfile {
    owner: PublicKey;
    lastPulse: number;        // Unix timestamp
    timeoutSeconds: number;
    beneficiary: PublicKey;
    mode: number;             // 0=Safeguard, 1=Feast
    isDead: boolean;
    ripCount: number;
    ripEarnings: number;      // V2: 累计 RIP 收入 (lamports)
    deathTime: number;        // V3: 死亡时间戳
    gameRound: number;        // V3: 游戏轮次
    bump: number;
    vaultBump: number;
}

export interface UserState {
    isLoading: boolean;
    isRegistered: boolean;
    profile: UserProfile | null;
    vaultBalance: number;     // lamports
    timeRemaining: number;    // seconds
    percentRemaining: number; // 0-100
    error: string | null;
}

export function useUserProfile() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { program } = useProgram();

    const [state, setState] = useState<UserState>({
        isLoading: true,
        isRegistered: false,
        profile: null,
        vaultBalance: 0,
        timeRemaining: 0,
        percentRemaining: 100,
        error: null,
    });

    // 获取用户数据
    const fetchUserData = useCallback(async () => {
        if (!publicKey || !program) {
            setState((prev) => ({ ...prev, isLoading: false, isRegistered: false }));
            return;
        }

        try {
            const [userProfilePDA] = getUserProfilePDA(publicKey);
            const [vaultPDA] = getVaultPDA(publicKey);

            // 检查用户是否注册
            const accountInfo = await connection.getAccountInfo(userProfilePDA);

            if (!accountInfo) {
                setState({
                    isLoading: false,
                    isRegistered: false,
                    profile: null,
                    vaultBalance: 0,
                    timeRemaining: 0,
                    percentRemaining: 100,
                    error: null,
                });
                return;
            }

            // 检查账户大小是否为 V3 (120 bytes)
            if (accountInfo.data.length !== 120) {
                console.warn(`账户版本不兼容 (${accountInfo.data.length} bytes)，请重新注册`);
                setState({
                    isLoading: false,
                    isRegistered: false,
                    profile: null,
                    vaultBalance: 0,
                    timeRemaining: 0,
                    percentRemaining: 100,
                    error: "账户版本不兼容，请重新注册",
                });
                return;
            }

            // 获取 UserProfile 数据
            const profileData = await (program.account as Record<string, {
                fetch: (pda: PublicKey) => Promise<{
                    owner: PublicKey;
                    lastPulse: BN;
                    timeoutSeconds: BN;
                    beneficiary: PublicKey;
                    mode: number;
                    isDead: boolean;
                    ripCount: number;
                    ripEarnings: BN;
                    deathTime: BN;     // V3
                    gameRound: BN;     // V3
                    bump: number;
                    vaultBump: number;
                }>
            }>).userProfile.fetch(userProfilePDA);

            // 获取 Vault 余额
            const vaultBalance = await connection.getBalance(vaultPDA);

            // 计算剩余时间
            const now = Math.floor(Date.now() / 1000);
            const lastPulse = profileData.lastPulse.toNumber();
            const timeout = profileData.timeoutSeconds.toNumber();
            const deadline = lastPulse + timeout;
            const timeRemaining = Math.max(0, deadline - now);
            const percentRemaining = timeout > 0 ? Math.min(100, (timeRemaining / timeout) * 100) : 0;

            const profile: UserProfile = {
                owner: profileData.owner,
                lastPulse,
                timeoutSeconds: timeout,
                beneficiary: profileData.beneficiary,
                mode: profileData.mode,
                isDead: profileData.isDead,
                ripCount: profileData.ripCount,
                ripEarnings: profileData.ripEarnings?.toNumber() || 0,
                deathTime: profileData.deathTime?.toNumber() || 0,     // V3
                gameRound: profileData.gameRound?.toNumber() || 1,     // V3
                bump: profileData.bump,
                vaultBump: profileData.vaultBump,
            };

            setState({
                isLoading: false,
                isRegistered: true,
                profile,
                vaultBalance,
                timeRemaining,
                percentRemaining,
                error: null,
            });
        } catch (err) {
            console.error("Failed to fetch user data:", err);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
        }
    }, [publicKey, program, connection]);

    // 初始加载
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    // 每秒更新倒计时
    useEffect(() => {
        if (!state.profile || state.profile.isDead) return;

        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const deadline = state.profile!.lastPulse + state.profile!.timeoutSeconds;
            const timeRemaining = Math.max(0, deadline - now);
            const percentRemaining = state.profile!.timeoutSeconds > 0
                ? Math.min(100, (timeRemaining / state.profile!.timeoutSeconds) * 100)
                : 0;

            setState((prev) => ({
                ...prev,
                timeRemaining,
                percentRemaining,
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, [state.profile]);

    return { ...state, refetch: fetchUserData };
}
