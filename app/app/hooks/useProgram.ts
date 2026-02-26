"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl.json";
import type { Solguard } from "../solguard";

export const PROGRAM_ID = new PublicKey(
    "72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q"
);

export function useProgram() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        if (!wallet) return null;
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
        return new Program<Solguard>(idl as any, provider);
    }, [connection, wallet]);

    return { program, connection, wallet };
}
