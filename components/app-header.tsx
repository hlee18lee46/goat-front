"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet-context";

type AppHeaderProps = {
  title: ReactNode;
  subtitle: ReactNode;
  showDevnetNotice?: boolean;
};

const navItems = [
  { label: "Home", href: "/landing" },
  { label: "Compose", href: "/vibe-composer" },
  { label: "Gradient", href: "/gradient-chat" },
  { label: "Chat", href: "/smollm2" },
];

export function AppHeader({
  title,
  subtitle,
  showDevnetNotice = true,
}: AppHeaderProps) {
  const { walletAddress } = useWallet();
  const pathname = usePathname();

  return (
    <header className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">

        {/* Navigation */}
        <nav className="flex justify-center gap-6 mb-8">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors
                  ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Title section */}
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
