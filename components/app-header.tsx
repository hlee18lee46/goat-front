"use client";

import type { ReactNode } from "react";
import { useWallet } from "@/components/wallet-context";

type AppHeaderProps = {
  title: ReactNode;
  subtitle: ReactNode;
  showDevnetNotice?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  showDevnetNotice = true,
}: AppHeaderProps) {
  const { walletAddress } = useWallet();

  return (
    <header className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {showDevnetNotice && (
          <div className="mb-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-foreground">
            <span className="font-medium">Devnet notice:</span> This app runs on{" "}
            <span className="font-semibold">Solana Devnet</span>. No real funds required.
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-balance text-foreground">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            {subtitle}
          </p>

          {walletAddress && (
            <p className="mt-3 text-xs text-muted-foreground">
              Connected wallet:{" "}
              <span className="font-mono">
                {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
