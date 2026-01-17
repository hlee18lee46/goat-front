"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getRouteOptions, getShapeForRoute } from "@/lib/mbta"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Timer, Bus, ArrowRight, Map as MapIcon } from "lucide-react"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const originId = searchParams.get("origin")
  const destId = searchParams.get("dest")
  
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (originId && destId) {
      // Logic: Fetch potential routes involving transfers
      const fetchRoutes = async () => {
        const data = await getRouteOptions(originId, destId)
        setRoutes(data)
        setLoading(false)
      }
      fetchRoutes()
    }
  }, [originId, destId])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 1. Interactive Map Section */}
      <div className="relative h-[40%] w-full bg-muted border-b">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
           <MapIcon className="mr-2 h-5 w-5" /> [Interactive Map Interface - Shapes would render here]
        </div>
      </div>

      {/* 2. Suggested Routes Section (Top 5) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xl font-bold px-1">Fastest Transfer Routes</h2>
        
        {loading ? (
          <div className="flex justify-center p-10"><Timer className="animate-spin" /></div>
        ) : (
          routes.map((route, index) => (
            <RouteCard key={index} route={route} />
          ))
        )}
      </main>
    </div>
  )
}

function RouteCard({ route }: { route: any }) {
  // Logic: Status determined by prediction buffer
  const statusColors = {
    LIKELY: "bg-green-500/10 text-green-600 border-green-500/20",
    RISKY: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    UNLIKELY: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  return (
    <Card className="border-border/50 hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex gap-1"><Bus className="h-3 w-3" /> {route.leg1.route}</Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="flex gap-1"><Bus className="h-3 w-3" /> {route.leg2.route}</Badge>
          </div>
          <Badge className={statusColors[route.status as keyof typeof statusColors]}>
            {route.status}
          </Badge>
        </div>

        <div className="flex justify-between text-sm">
          <div className="text-muted-foreground">
            Transfer at <span className="text-foreground font-medium">{route.transferStop}</span>
          </div>
          <div className="font-bold">{route.totalTime} mins</div>
        </div>
        
        {/* What-If Scenario Context */}
        {route.status === "UNLIKELY" && (
          <p className="mt-2 text-[10px] text-red-500 italic">
            * Delay detected. Arriving after departure. Fallback suggested.
          </p>
        )}
      </CardContent>
    </Card>
  )
}