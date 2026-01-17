"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getProvider, connectWallet, disconnectWallet, shortenAddress } from "@/lib/phantom-wallet"
import { Wallet, LogOut, Copy, ExternalLink, Check } from "lucide-react"

interface WalletButtonProps {
  onConnect: (address: string | null) => void
}

export function WalletButton({ onConnect }: WalletButtonProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const provider = getProvider()
    if (provider?.publicKey) {
      const address = provider.publicKey.toString()
      setWalletAddress(address)
      onConnect(address)
    }

    const handleAccountChange = () => {
      const provider = getProvider()
      if (provider?.publicKey) {
        const address = provider.publicKey.toString()
        setWalletAddress(address)
        onConnect(address)
      } else {
        setWalletAddress(null)
        onConnect(null)
      }
    }

    provider?.on("accountChanged", handleAccountChange)
    return () => {
      provider?.off("accountChanged", handleAccountChange)
    }
  }, [onConnect])

  const handleConnect = async () => {
    setIsConnecting(true)
    const address = await connectWallet()
    setWalletAddress(address)
    onConnect(address)
    setIsConnecting(false)
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
    setWalletAddress(null)
    onConnect(null)
  }

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!walletAddress) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Phantom"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:border-primary bg-transparent">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {shortenAddress(walletAddress)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
