"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { RouteFinder } from "@/components/route-finder"
import { FeaturesSection } from "@/components/features-section"

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Header onConnect={setWalletAddress} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance text-foreground">
              Navigate Boston with <span className="text-primary">Web3</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
              Connect your Phantom wallet and discover the fastest routes across the MBTA network. Powered by Solana
              Devnet.
            </p>
          </div>

          {/* Core logic component with wallet state */}
          <RouteFinder isConnected={!!walletAddress} />
        </div>

        <FeaturesSection />

        <footer className="mt-16 py-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Built for Solana Devnet • MBTA API v3 •{" "}
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
    </div>
  )
}