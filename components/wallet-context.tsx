"use client"

import * as React from "react"

type WalletAddress = string

type WalletContextValue = {
  walletAddress: WalletAddress | null
  setWalletAddress: (addr: WalletAddress | null) => void
}

const WalletContext = React.createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = React.useState<WalletAddress | null>(null)

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = React.useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>")
  return ctx
}
