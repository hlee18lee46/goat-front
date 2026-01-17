const MBTA_API_URL = "https://api-v3.mbta.com";

// Logic for "Near Me" button
export async function getNearbyStops(lat: number, lng: number, radius = 0.01) {
  const params = new URLSearchParams({
    "filter[latitude]": lat.toString(),
    "filter[longitude]": lng.toString(),
    "filter[radius]": radius.toString(),
    "sort": "distance",
    "page[limit]": "5"
  });

  const response = await fetch(`${MBTA_API_URL}/stops?${params}`);
  const json = await response.json();
  return json.data; // Top 5 stops within ~0.5 miles
}

// Logic for manual typing search (e.g., "Worcester")
export async function searchStopsByQuery(query: string) {
  // MBTA API doesn't have a direct name search filter on the server, 
  // so we fetch all stops and filter locally for a smooth experience.
  const response = await fetch(`${MBTA_API_URL}/stops`);
  const json = await response.json();
  
  return json.data.filter((stop: any) => 
    stop.attributes.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Return top 5 matches
}

// Logic for "Live Connection Finder"
export async function getTransferPredictions(stopId: string) {
  const response = await fetch(`${MBTA_API_URL}/predictions?filter[stop]=${stopId}&include=route,trip`);
  const json = await response.json();
  return json.data; // Live real-time arrivals
}