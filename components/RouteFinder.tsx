"use client"

import { useState, useEffect } from "react"
import { useGeolocation } from "@/hooks/useGeolocation"
import { getNearbyStops, searchStopsByQuery } from "@/lib/mbta"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, ArrowRightLeft, AlertTriangle, Loader2, Check, Timer } from "lucide-react"

interface RouteFinderProps {
  isConnected: boolean
}

export function RouteFinder({ isConnected }: RouteFinderProps) {
  const { location, getLocation } = useGeolocation()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [nearbyStops, setNearbyStops] = useState<any[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [showStopList, setShowStopList] = useState(false)
  const [status, setStatus] = useState<"LIKELY" | "RISKY" | "UNLIKELY" | null>(null)

  // Fetch 5 closest stops based on Geolocation
  useEffect(() => {
    if (location) {
      const fetchNearby = async () => {
        try {
          const stops = await getNearbyStops(location.lat, location.lng)
          setNearbyStops(stops)
          setShowStopList(true)
        } catch (err) {
          console.error("Failed to fetch nearby stops", err)
        } finally {
          setIsLocating(false)
        }
      }
      fetchNearby()
    }
  }, [location])

  // Fetch stops based on manual text input (Starting Point)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (origin.length >= 3 && !showStopList) {
        const results = await searchStopsByQuery(origin)
        setNearbyStops(results)
        setShowStopList(true)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [origin, showStopList])

  const handleNearMeClick = () => {
    setOrigin("")
    setIsLocating(true)
    getLocation() // Captures geographic data
  }

  const selectStop = (stopName: string) => {
    setOrigin(stopName)
    setShowStopList(false)
  }

  const handleSimulateRoute = () => {
    // Logic: Simulate What-If Scenario status based on buffer
    setStatus("RISKY")
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Plan Your Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Starting Point Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Starting Point</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type 'Worcester' or use Near Me"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value)
                  setShowStopList(false)
                }}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleNearMeClick}
              disabled={isLocating}
              className="min-w-[100px]"
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Near Me"}
            </Button>
          </div>
        </div>

        {/* Dynamic Stops List (From Search or Geolocation) */}
        {showStopList && nearbyStops.length > 0 && (
          <div className="p-2 border rounded-md bg-muted/30 space-y-1 animate-in fade-in slide-in-from-top-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">Select a Stop</p>
            {nearbyStops.map((stop) => (
              <Button
                key={stop.id}
                variant="ghost"
                className="w-full justify-start font-normal text-sm h-8 px-2 hover:bg-primary/10"
                onClick={() => selectStop(stop.attributes.name)}
              >
                <Check className={`mr-2 h-3 w-3 ${origin === stop.attributes.name ? "opacity-100" : "opacity-0"}`} />
                {stop.attributes.name}
                <span className="ml-auto text-[10px] text-muted-foreground">{stop.attributes.municipality}</span>
              </Button>
            ))}
          </div>
        )}

        <div className="flex justify-center py-1">
          <ArrowRightLeft className="h-4 w-4 rotate-90 text-muted-foreground" />
        </div>

        {/* Destination Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Destination</label>
          <Input
            placeholder="Enter destination stop"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        {/* Confidence Indicator */}
        {status && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm font-medium border ${
            status === "LIKELY" ? "bg-green-500/10 border-green-500/20 text-green-600" :
            status === "RISKY" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600" :
            "bg-red-500/10 border-red-500/20 text-red-600"
          }`}>
            <Timer className="h-4 w-4" />
            Transfer Status: {status}
          </div>
        )}

        {!isConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Connect wallet to save routes and earn rewards.
          </div>
        )}

        <Button 
          className="w-full" 
          size="lg" 
          disabled={!origin || !destination}
          onClick={handleSimulateRoute}
        >
          Find Fastest Route
        </Button>
      </CardContent>
    </Card>
  )
}