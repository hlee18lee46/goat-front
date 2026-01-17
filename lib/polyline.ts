import polyline from "@mapbox/polyline"

export type LatLng = { lat: number; lng: number }

export function decodeMBTAPolyline(encoded: string): LatLng[] {
  const pts = polyline.decode(encoded) as [number, number][]
  return pts.map(([lat, lng]) => ({ lat, lng }))
}
