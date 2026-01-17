"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getRouteOptions, getShapeForRoute } from "@/lib/mbta"
import RouteMap from "@/components/RouteMapClient"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Timer, Bus, ArrowRight } from "lucide-react"

type Leg = {
  routeId?: string
  route?: string // fallback/old
  routeName?: string
}

type TransferStop = string | { id?: string; name?: string } | null | undefined

type RouteOption = {
  legs?: Leg[]
  leg1?: { route?: string; routeId?: string; routeName?: string } // old
  leg2?: { route?: string; routeId?: string; routeName?: string } // old
  transferStop?: TransferStop
  totalTime?: number
  status?: "LIKELY" | "RISKY" | "UNLIKELY" | string
}

function normalizeLegs(route: RouteOption): Leg[] {
  if (Array.isArray(route.legs) && route.legs.length > 0) return route.legs
  const out: Leg[] = []
  if (route.leg1) out.push({ ...route.leg1 })
  if (route.leg2) out.push({ ...route.leg2 })
  return out
}

function transferStopName(ts: TransferStop) {
  if (!ts) return null
  if (typeof ts === "string") return ts
  return ts.name ?? ts.id ?? null
}

/**
 * IMPORTANT:
 * MBTA shapes endpoint requires a ROUTE ID (e.g. "Red", "1", "SL1")
 * NOT a display name (e.g. "Red Line").
 *
 * This helper tries to convert common display names to MBTA route ids.
 * Best fix: ensure backend returns legs[].routeId always.
 */
function normalizeRouteIdForShapes(ridOrName: string): string {
  const s = (ridOrName || "").trim()

  // Already an ID-like value (most MBTA route ids are short)
  // Keep it if it doesn't look like a full name.
  if (s.length <= 6 && !s.toLowerCase().includes("line")) return s

  const lower = s.toLowerCase()

  // Common rail lines
  if (lower.includes("red")) return "Red"
  if (lower.includes("orange")) return "Orange"
  if (lower.includes("blue")) return "Blue"
  if (lower.includes("green")) {
    // Green line branches: B/C/D/E route ids in MBTA are "Green-B", etc.
    if (lower.includes("green-b")) return "Green-B"
    if (lower.includes("green c") || lower.includes("green-c")) return "Green-C"
    if (lower.includes("green d") || lower.includes("green-d")) return "Green-D"
    if (lower.includes("green e") || lower.includes("green-e")) return "Green-E"
    return "Green"
  }

  // Silver Line (common route ids: SL1, SL2, SL3, SL4, SL5)
  if (lower.includes("silver")) {
    const m = s.match(/SL\s?(\d)/i)
    if (m?.[1]) return `SL${m[1]}`
    // fallback to SL1 if no branch specified
    return "SL1"
  }

  // If it looks like "Bus 1" => "1"
  const busMatch = s.match(/bus\s+([0-9A-Za-z]+)/i)
  if (busMatch?.[1]) return busMatch[1]

  // If it’s "Route 66" => "66"
  const routeMatch = s.match(/route\s+([0-9A-Za-z]+)/i)
  if (routeMatch?.[1]) return routeMatch[1]

  // Final fallback: return as-is (might still work)
  return s
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const originId = searchParams.get("origin")
  const destId = searchParams.get("dest")
  const depart = searchParams.get("depart") ?? undefined

  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [loading, setLoading] = useState(true)

  // which route is selected
  const [selectedIndex, setSelectedIndex] = useState(0)

  // multiple leg polylines
  const [polylines, setPolylines] = useState<string[]>([])

  // fetch route options
  useEffect(() => {
    if (!originId || !destId) return

    const fetchRoutes = async () => {
      try {
        setLoading(true)
        const data = await getRouteOptions(originId, destId, depart)
        const list: RouteOption[] = Array.isArray(data) ? data : (data?.routes ?? [])
        setRoutes(list)
        setSelectedIndex(0)
      } catch (e) {
        console.error(e)
        setRoutes([])
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [originId, destId, depart])

  const selectedRoute = routes[selectedIndex]

  // fetch shapes for the selected route legs
  useEffect(() => {
    if (!selectedRoute) {
      setPolylines([])
      return
    }

    const legs = normalizeLegs(selectedRoute)

    // Prefer routeId; fallback to route (old)
    const routeIdsRaw = legs
      .map((l) => l.routeId || l.route)
      .filter(Boolean) as string[]

    // Normalize route names -> route ids for shapes
    const routeIds = routeIdsRaw.map(normalizeRouteIdForShapes).filter(Boolean)

    const load = async () => {
      try {
        if (routeIds.length === 0) {
          setPolylines([])
          return
        }

        const shapes = await Promise.all(routeIds.map((rid) => getShapeForRoute(rid)))
        setPolylines(shapes.filter(Boolean) as string[])
      } catch (e) {
        console.error(e)
        setPolylines([])
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, routes])

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="relative h-[40%] w-full bg-muted border-b">
        {/* RouteMapClient must accept encodedPolylines: string[] */}
        <RouteMap encodedPolylines={polylines} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold">Fastest Transfer Routes</h2>
          {!loading && routes.length > 0 && (
            <p className="text-xs text-muted-foreground">Tap a route to preview on map</p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Timer className="animate-spin" />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-sm text-muted-foreground px-1">
            No routes returned. (Check backend /route_options output)
          </div>
        ) : (
          routes.map((route, index) => (
            <RouteCard
              key={index}
              route={route}
              selected={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
            />
          ))
        )}
      </main>
    </div>
  )
}

function RouteCard({
  route,
  selected,
  onClick,
}: {
  route: RouteOption
  selected: boolean
  onClick: () => void
}) {
  const statusColors: Record<string, string> = {
    LIKELY: "bg-green-500/10 text-green-600 border-green-500/20",
    RISKY: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    UNLIKELY: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  const legs = useMemo(() => normalizeLegs(route), [route])
  const stopName = transferStopName(route.transferStop)

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer border-border/50 transition-colors ${
        selected ? "border-primary/70" : "hover:border-primary/50"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {legs.length === 0 ? (
              <Badge variant="outline" className="flex gap-1">
                <Bus className="h-3 w-3" /> -
              </Badge>
            ) : (
              legs.map((leg, i) => (
                <div key={`${leg.routeId ?? leg.route ?? "leg"}-${i}`} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex gap-1">
                    <Bus className="h-3 w-3" /> {leg.routeName ?? leg.route ?? leg.routeId ?? "-"}
                  </Badge>
                  {i < legs.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))
            )}
          </div>

          <Badge className={statusColors[route.status ?? ""] ?? "border border-border/50"}>
            {route.status ?? "UNKNOWN"}
          </Badge>
        </div>

        <div className="flex justify-between text-sm">
          <div className="text-muted-foreground">
            {legs.length <= 1 ? (
              <>Direct ride</>
            ) : (
              <>
                Transfer at <span className="text-foreground font-medium">{stopName ?? "-"}</span>
              </>
            )}
          </div>
          <div className="font-bold">{route.totalTime ?? "-"} mins</div>
        </div>
      </CardContent>
    </Card>
  )
}
