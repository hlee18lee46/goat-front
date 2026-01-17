import { Card, CardContent } from "@/components/ui/card"
import { Shield, Zap, Globe, Wallet } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure & Decentralized",
    description: "Your wallet, your data. No central authority controls your transit experience.",
  },
  {
    icon: Zap,
    title: "Real-time Routes",
    description: "Get instant route suggestions powered by MBTA's official API.",
  },
  {
    icon: Globe,
    title: "Solana Devnet",
    description: "Built on Solana's high-performance blockchain for fast, low-cost transactions.",
  },
  {
    icon: Wallet,
    title: "Phantom Integration",
    description: "Seamlessly connect with your Phantom wallet in one click.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Why SolTransit?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors"
          >
            <CardContent className="pt-6">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
