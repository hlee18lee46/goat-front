"use client"

import { MapContainer, TileLayer, Polyline } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import { useMemo } from "react"
import { decodeMBTAPolyline } from "@/lib/polyline"

export function RouteMap({ encodedPolyline }: { encodedPolyline: string | null }) {
  const points = useMemo(() => {
    if (!encodedPolyline) return []
    return decodeMBTAPolyline(encodedPolyline).map((p) => [p.lat, p.lng] as LatLngExpression)
  }, [encodedPolyline])

  const center = points.length ? (points[Math.floor(points.length / 2)] as LatLngExpression) : ([42.3601, -71.0589] as LatLngExpression)

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 0 && <Polyline positions={points} />}
    </MapContainer>
  )
}
