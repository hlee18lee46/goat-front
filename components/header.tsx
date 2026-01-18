"use client"

import { WalletButton } from "./wallet-button"
import { Train } from "lucide-react"

interface HeaderProps {
  onConnect: (address: string | null) => void
}

export function Header({ onConnect }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Train className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Vibe-Composer</h1>
            <p className="text-xs text-muted-foreground"> vibe the music</p>
          </div>
        </div>
        <WalletButton onConnect={onConnect} />
      </div>
    </header>
  )
}
