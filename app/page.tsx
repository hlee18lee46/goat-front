"use client"

import { RouteFinder } from "@/components/route-finder"
import { FeaturesSection } from "@/components/features-section"
import { useWallet } from "@/components/wallet-context"

export default function Home() {
  const { walletAddress } = useWallet()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-foreground">
          <span className="font-medium">Devnet notice:</span> This app runs on{" "}
          <span className="font-semibold">Solana Devnet</span>. No real funds required.
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-balance text-foreground">
            Navigate Boston with <span className="text-primary">Web3</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            Connect your Phantom wallet and discover the fastest routes across the MBTA network. Powered by Solana
            Devnet.
          </p>
        </div>

        <RouteFinder isConnected={!!walletAddress} />
      </div>

      <FeaturesSection />

      <footer className="mt-16 py-8 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          Built for <span className="font-medium">Solana Devnet</span> • MBTA API v3 •{" "}
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get Phantom Wallet
          </a>
        </p>
      </footer>
    </main>
  )
}
