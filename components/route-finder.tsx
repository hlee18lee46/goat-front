"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGeolocation } from "@/hooks/useGeolocation"
import { getNearbyStops, searchStopsByQuery } from "@/lib/mbta"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, ArrowRightLeft, AlertTriangle, Loader2, Check } from "lucide-react"

interface RouteFinderProps {
  isConnected: boolean
}

type StopOption = {
  id: string
  name: string
  municipality?: string
}

function toStopOption(stop: any): StopOption {
  return {
    id: stop.id,
    name: stop.attributes?.name ?? "",
    municipality: stop.attributes?.municipality,
  }
}

export function RouteFinder({ isConnected }: RouteFinderProps) {
  const router = useRouter()
  const { location, getLocation } = useGeolocation()

  // store BOTH id + name
  const [origin, setOrigin] = useState<StopOption | null>(null)
  const [destination, setDestination] = useState<StopOption | null>(null)

  // input text fields (what user types)
  const [originText, setOriginText] = useState("")
  const [destinationText, setDestinationText] = useState("")

  const [originStops, setOriginStops] = useState<StopOption[]>([])
  const [destinationStops, setDestinationStops] = useState<StopOption[]>([])

  const [isLocating, setIsLocating] = useState(false)
  const [showOriginList, setShowOriginList] = useState(false)
  const [showDestinationList, setShowDestinationList] = useState(false)

  // --- ORIGIN: geolocation -> nearest stops
  useEffect(() => {
    if (!location) return

    const fetchNearby = async () => {
      try {
        const stops = await getNearbyStops(location.lat, location.lng)
        setOriginStops(stops.map(toStopOption))
        setShowOriginList(true)
      } catch (err) {
        console.error("Failed to fetch nearby stops", err)
      } finally {
        setIsLocating(false)
      }
    }

    fetchNearby()
  }, [location])

  // --- ORIGIN: text search debounce
  useEffect(() => {
    if (isLocating) return

    const t = setTimeout(async () => {
      if (originText.length >= 3 && !showOriginList) {
        try {
          const results = await searchStopsByQuery(originText)
          setOriginStops(results.map(toStopOption))
          setShowOriginList(true)
        } catch (err) {
          console.error("Failed to search origin stops", err)
        }
      }
    }, 450)

    return () => clearTimeout(t)
  }, [originText, showOriginList, isLocating])

  // --- DESTINATION: text search debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (destinationText.length >= 3 && !showDestinationList) {
        try {
          const results = await searchStopsByQuery(destinationText)
          setDestinationStops(results.map(toStopOption))
          setShowDestinationList(true)
        } catch (err) {
          console.error("Failed to search destination stops", err)
        }
      }
    }, 450)

    return () => clearTimeout(t)
  }, [destinationText, showDestinationList])

  const handleNearMeClick = () => {
    setOrigin(null)
    setOriginText("")
    setIsLocating(true)
    setShowOriginList(false)
    getLocation()
  }

  const selectOriginStop = (stop: StopOption) => {
    setOrigin(stop)
    setOriginText(stop.name)
    setShowOriginList(false)
  }

  const selectDestinationStop = (stop: StopOption) => {
    setDestination(stop)
    setDestinationText(stop.name)
    setShowDestinationList(false)
  }

  const handleFindFastestRoute = () => {
    if (!origin?.id || !destination?.id) return
    router.push(`/results?origin=${encodeURIComponent(origin.id)}&dest=${encodeURIComponent(destination.id)}`)
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
        {/* Starting Point */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Starting Point</label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type a stop (ex: South Station) or use Near Me"
                value={originText}
                onChange={(e) => {
                  setOriginText(e.target.value)
                  setOrigin(null) // typing means "not selected yet"
                  setShowOriginList(false)
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

          {showOriginList && originStops.length > 0 && (
            <div className="p-2 border rounded-md bg-muted/30 space-y-1 animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">Select a Stop</p>
              {originStops.map((stop) => (
                <Button
                  key={stop.id}
                  variant="ghost"
                  className="w-full justify-start font-normal text-sm h-8 px-2 hover:bg-primary/10"
                  onClick={() => selectOriginStop(stop)}
                >
                  <Check className={`mr-2 h-3 w-3 ${origin?.id === stop.id ? "opacity-100" : "opacity-0"}`} />
                  {stop.name}
                  <span className="ml-auto text-[10px] text-muted-foreground">{stop.municipality ?? ""}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center py-1">
          <ArrowRightLeft className="h-4 w-4 rotate-90 text-muted-foreground" />
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Destination</label>

          <Input
            placeholder="Type a stop (ex: Harvard)"
            value={destinationText}
            onChange={(e) => {
              setDestinationText(e.target.value)
              setDestination(null)
              setShowDestinationList(false)
            }}
          />

          {showDestinationList && destinationStops.length > 0 && (
            <div className="p-2 border rounded-md bg-muted/30 space-y-1 animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">Select a Stop</p>
              {destinationStops.map((stop) => (
                <Button
                  key={stop.id}
                  variant="ghost"
                  className="w-full justify-start font-normal text-sm h-8 px-2 hover:bg-primary/10"
                  onClick={() => selectDestinationStop(stop)}
                >
                  <Check className={`mr-2 h-3 w-3 ${destination?.id === stop.id ? "opacity-100" : "opacity-0"}`} />
                  {stop.name}
                  <span className="ml-auto text-[10px] text-muted-foreground">{stop.municipality ?? ""}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Connect wallet to save routes and earn rewards.
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!origin?.id || !destination?.id}
          onClick={handleFindFastestRoute}
        >
          Find Fastest Route
        </Button>
      </CardContent>
    </Card>
  )
}
