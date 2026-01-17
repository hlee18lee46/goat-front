const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"

// helper: always return JSON
async function getJSON(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  return res.json()
}

/** Near Me: uses backend /mbta/stops?filter[latitude]... */
export async function getNearbyStops(lat: number, lng: number, radius = 0.01) {
  const params = new URLSearchParams({
    "filter[latitude]": lat.toString(),
    "filter[longitude]": lng.toString(),
    "filter[radius]": radius.toString(),
    sort: "distance",
    "page[limit]": "5",
  })

  const json = await getJSON(`${API_BASE}/mbta/stops?${params.toString()}`)
  return json.data
}

/** Stop search: DO NOT fetch all stops. Use backend which forwards query to MBTA */
export async function searchStopsByQuery(query: string) {
  const q = query.trim()
  if (q.length < 2) return []

  // ✅ best: implement this backend endpoint (see below)
  const params = new URLSearchParams({ q, limit: "5" })
  const json = await getJSON(`${API_BASE}/mbta/stops_search?${params.toString()}`)
  return json.data
}

/** Live predictions */
export async function getTransferPredictions(stopId: string) {
  const params = new URLSearchParams({
    "filter[stop]": stopId,
    include: "route,trip",
    sort: "departure_time",
    "page[limit]": "20",
  })

  const json = await getJSON(`${API_BASE}/mbta/predictions?${params.toString()}`)
  return json.data
}

/** Route options (still mocked in your code) */
export async function getRouteOptions(originId: string, destId: string) {
  const params = new URLSearchParams({ origin: originId, dest: destId })
  const json = await getJSON(`${API_BASE}/route_options?${params.toString()}`)
  return json
}


export function calculateTransferStatus(arrivalPrediction: any, departurePrediction: any, walkTime = 3) {
  const arrival = new Date(arrivalPrediction.attributes.arrival_time).getTime()
  const departure = new Date(departurePrediction.attributes.departure_time).getTime()
  const bufferMinutes = (departure - arrival) / 60000 - walkTime

  if (bufferMinutes > 5) return "LIKELY"
  if (bufferMinutes >= 0) return "RISKY"
  return "UNLIKELY"
}

/** Map shape polyline (route filter sometimes returns multiple shapes; we take first) */
export async function getShapeForRoute(routeId: string) {
  const params = new URLSearchParams({
    "filter[route]": routeId,
    "page[limit]": "1",
  })
  const json = await getJSON(`${API_BASE}/mbta/shapes?${params.toString()}`)
  return json.data?.[0]?.attributes?.polyline
}


