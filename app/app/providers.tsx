"use client";

import { useMemo, ReactNode } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

const DEVNET_RPC = "https://api.devnet.solana.com";

export default function Providers({ children }: { children: ReactNode }) {
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={DEVNET_RPC}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
