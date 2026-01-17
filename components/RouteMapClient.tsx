"use client"

import dynamic from "next/dynamic"

const RouteMap = dynamic(() => import("./RouteMap").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
      Loading map...
    </div>
  ),
})

export default RouteMap


