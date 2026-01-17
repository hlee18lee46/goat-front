"use client"

import { useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { useWallet } from "@/components/wallet-context"

type WalletAddress = string

export function AppShell({ children }: { children: React.ReactNode }) {
  const { walletAddress, setWalletAddress } = useWallet()

  // restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wallet_address")
      if (saved) setWalletAddress(saved)
    } catch {}
  }, [setWalletAddress])

  // keep localStorage in sync when Header/WalletButton reports changes
  const handleConnect = useCallback(
    (address: WalletAddress | null) => {
      setWalletAddress(address)
      try {
        if (address) localStorage.setItem("wallet_address", address)
        else localStorage.removeItem("wallet_address")
      } catch {}
    },
    [setWalletAddress]
  )

  return (
    <div className="min-h-screen bg-background">
      <Header onConnect={handleConnect} />
      {children}
    </div>
  )
}
