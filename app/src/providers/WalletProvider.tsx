"use client";

import { FC, ReactNode, useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// 导入钱包适配器样式
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
    children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
    // 使用环境变量或默认 devnet
    const endpoint = useMemo(
        () => process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet"),
        []
    );

    // 配置支持的钱包
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
