import type { Metadata } from "next";
import "./globals.css";
import { SolanaWalletProvider } from "@/providers/WalletProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Sol了没 | NotDeadYet - 链上死亡开关",
  description: "活着天天签到，死了全网吃席！基于 Solana 的死亡开关应用。",
  keywords: ["Solana", "Web3", "Deadman Switch", "Crypto", "Degen"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`antialiased font-sans`}>
        <SolanaWalletProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
