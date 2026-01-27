import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import idl from "./sol_le_mei.json";

// Program ID from the IDL
export const PROGRAM_ID = new PublicKey(idl.address);

// Devnet connection
export const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet"),
  "confirmed"
);

// Get program instance (read-only, no wallet needed for building txs)
export function getProgram(): Program {
  const provider = {
    connection,
    publicKey: null,
  } as unknown as AnchorProvider;
  
  return new Program(idl as Idl, provider);
}

// PDA derivation helpers
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
