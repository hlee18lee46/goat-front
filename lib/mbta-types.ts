export interface MBTAStop {
  id: string
  attributes: {
    name: string
    latitude: number
    longitude: number
  }
}

export interface MBTARoute {
  id: string
  attributes: {
    long_name: string
    short_name: string
    color: string
    text_color: string
    type: number
  }
}

export interface MBTASchedule {
  id: string
  attributes: {
    arrival_time: string | null
    departure_time: string | null
  }
  relationships: {
    stop: { data: { id: string } }
    route: { data: { id: string } }
    trip: { data: { id: string } }
  }
}

export interface RouteStep {
  routeName: string
  routeColor: string
  routeTextColor: string
  fromStop: string
  toStop: string
  departureTime: string
  arrivalTime: string
  type: "subway" | "bus" | "commuter_rail" | "ferry" | "walk"
}

export interface TripResult {
  steps: RouteStep[]
  totalDuration: string
  departureTime: string
  arrivalTime: string
}

export const POPULAR_STOPS = [
  { id: "place-north", name: "North Station" },
  { id: "place-sstat", name: "South Station" },
  { id: "place-dwnxg", name: "Downtown Crossing" },
  { id: "place-pktrm", name: "Park Street" },
  { id: "place-gover", name: "Government Center" },
  { id: "place-state", name: "State" },
  { id: "place-haecl", name: "Haymarket" },
  { id: "place-aport", name: "Airport" },
  { id: "place-harsq", name: "Harvard" },
  { id: "place-cntsq", name: "Central" },
  { id: "place-knncl", name: "Kendall/MIT" },
  { id: "place-chmnl", name: "Charles/MGH" },
  { id: "place-boyls", name: "Boylston" },
  { id: "place-coecl", name: "Copley" },
  { id: "place-hymnl", name: "Hynes Convention Center" },
  { id: "place-kencl", name: "Kenmore" },
  { id: "place-fenwy", name: "Fenway" },
  { id: "place-bbsta", name: "Back Bay" },
  { id: "place-ruMDc-", name: "Ruggles" },
  { id: "place-masta", name: "Massachusetts Ave" },
]
