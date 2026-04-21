import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

export default function HeatLayer({ points, options = {} }) {
  const map = useMap()

  useEffect(() => {
    if (!points || points.length === 0) return
    const heat = L.heatLayer(points, {
      radius: 28,
      blur: 18,
      maxZoom: 14,
      gradient: { 0.2: '#3b82f6', 0.5: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' },
      ...options,
    }).addTo(map)
    return () => { map.removeLayer(heat) }
  }, [map, points, options])

  return null
}
