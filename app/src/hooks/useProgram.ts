"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import idl from "@/sol_le_mei.json";
import { PublicKey } from "@solana/web3.js";

// Program ID
export const PROGRAM_ID = new PublicKey(idl.address);

// PDA 推导函数
export function getUserProfilePDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("user_profile"), user.toBuffer()],
        PROGRAM_ID
    );
}

export function getVaultPDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), user.toBuffer()],
        PROGRAM_ID
    );
}

export function getRipRecordPDA(sender: PublicKey, target: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("rip"), sender.toBuffer(), target.toBuffer()],
        PROGRAM_ID
    );
}

export function getGraveyardPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("graveyard")],
        PROGRAM_ID
    );
}

// 🆕 V2: DeathRecord PDA
export function getDeathRecordPDA(deceased: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("death"), deceased.toBuffer()],
        PROGRAM_ID
    );
}

// 获取 Program 实例的 Hook
export function useProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const program = useMemo(() => {
        if (!wallet.publicKey) return null;

        const provider = new AnchorProvider(
            connection,
            wallet as never,
            { commitment: "confirmed" }
        );

        return new Program(idl as Idl, provider);
    }, [connection, wallet]);

    return { program, programId: PROGRAM_ID };
}
