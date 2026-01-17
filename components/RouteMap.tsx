"use client"

import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import { useMemo } from "react"
import { decodeMBTAPolyline } from "@/lib/polyline"

type Props = {
  encodedPolylines: string[] // multiple legs
}

export function RouteMap({ encodedPolylines }: Props) {
  const lines = useMemo(() => {
    return (encodedPolylines ?? [])
      .filter(Boolean)
      .map((enc) => decodeMBTAPolyline(enc).map((p) => [p.lat, p.lng] as LatLngExpression))
      .filter((arr) => arr.length > 1)
  }, [encodedPolylines])

  const center: LatLngExpression = useMemo(() => {
    const first = lines[0]
    if (first && first.length) return first[Math.floor(first.length / 2)]
    return [42.3601, -71.0589] // Boston fallback
  }, [lines])

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {lines.map((positions, idx) => (
        <Polyline
          key={idx}
          positions={positions}
          pathOptions={{
            color: idx === 0 ? "#16a34a" : "#2563eb",
            weight: 5,
            opacity: 0.9,
          }}
        />
      ))}
    </MapContainer>
  )
}
