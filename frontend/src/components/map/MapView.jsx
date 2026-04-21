import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, GeoJSON, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import { shortPrice } from '../../utils/formatters'
import HeatLayer from './HeatLayer'
import LayerControl from './LayerControl'
import MapLegend from './MapLegend'
import HoverCard from './HoverCard'
import SidePanel from './SidePanel'
import PostcodeSearch from './PostcodeSearch'

export default function MapView() {
  const { toQueryParams } = useFilters()
  const params = toQueryParams()
  const { data: listingsData, loading: listingsLoading } = useApi(() => api.mapListings(params), [JSON.stringify(params)])
  const { data: boroughData } = useApi(() => api.mapBoroughStats(), [])
  const [londonGeoJSON, setLondonGeoJSON] = useState(null)
  const [activeLayer, setActiveLayer] = useState('property')
  const [hoveredListing, setHoveredListing] = useState(null)
  const [hoverPos, setHoverPos] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)

  const listings = listingsData?.data ?? []
  const boroughStats = useMemo(() => {
    if (!boroughData?.data) return {}
    const map = {}
    boroughData.data.forEach(b => {
      map[b.borough_name.toLowerCase()] = b
    })
    return map
  }, [boroughData])

  // Fetch London GeoJSON once
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson')
      .then(r => r.json())
      .then(setLondonGeoJSON)
      .catch(() => console.warn('GeoJSON fetch failed'))
  }, [])

  // Color helpers
  const priceColor = (price, min, max) => {
    if (!price || min === max) return '#888'
    const ratio = (price - min) / (max - min)
    if (ratio < 0.33) return '#22c55e'
    if (ratio < 0.67) return '#eab308'
    return '#ef4444'
  }

  const dealColor = (price, boroughAvg) => {
    if (!price || !boroughAvg) return '#888'
    const ratio = price / boroughAvg
    if (ratio < 0.85) return '#22c55e'
    if (ratio < 1.15) return '#eab308'
    return '#ef4444'
  }

  const bedroomColor = (beds) => {
    if (!beds) return '#888'
    if (beds <= 2) return '#818cf8'
    if (beds <= 4) return '#f59e0b'
    return '#ef4444'
  }

  const compositeColor = (score) => {
    if (!score) return '#888'
    const ratio = (score - 2) / 3
    if (ratio < 0.33) return '#ef4444'
    if (ratio < 0.67) return '#eab308'
    return '#22c55e'
  }

  // Compute min/max prices
  const prices = listings.map(l => l.price).filter(p => p)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 1

  // Data for layers
  const heatPoints = listings
    .filter(l => l.latitude && l.longitude)
    .map(l => [l.latitude, l.longitude, (l.price - minPrice) / (maxPrice - minPrice + 1)])

  const boroughGeoJSONStyle = (feature) => {
    const boroughName = feature.properties?.name?.toLowerCase()
    const stats = boroughStats[boroughName]
    const price = stats?.avg_price_all || 0
    return {
      color: priceColor(price, minPrice, maxPrice),
      weight: 2,
      opacity: 0.7,
      fillOpacity: 0.4,
      fillColor: priceColor(price, minPrice, maxPrice),
    }
  }

  const boroughGeoJSONOnEachFeature = (feature, layer) => {
    const name = feature.properties?.name
    const stats = boroughStats[name?.toLowerCase()]
    const html = `
      <div style="font-size:13px; min-width:160px">
        <strong>${name}</strong><br/>
        Avg Price: ${shortPrice(stats?.avg_price_all)}<br/>
        Rent: ${shortPrice(stats?.avg_price_rent)}/mo<br/>
        Buy: ${shortPrice(stats?.avg_price_buy)}<br/>
        Listings: ${stats?.total_count || 0}
      </div>
    `
    layer.bindPopup(html)
  }

  function handleListingHover(listing, e) {
    setHoveredListing(listing)
    const rect = e.target._container?.getBoundingClientRect?.()
    if (rect) setHoverPos({ x: rect.left, y: rect.top })
  }

  function handleListingClick(listing) {
    setSelectedListing(listing)
  }

  // Render appropriate layer
  const layerContent = () => {
    switch (activeLayer) {
      case 'property':
        return listings.map(l => l.latitude && l.longitude ? (
          <CircleMarker
            key={l.listing_id}
            center={[l.latitude, l.longitude]}
            radius={5}
            fillColor={priceColor(l.price, minPrice, maxPrice)}
            color={priceColor(l.price, minPrice, maxPrice)}
            fillOpacity={0.75}
            weight={1}
            eventHandlers={{
              mouseover: (e) => handleListingHover(l, e),
              mouseout: () => setHoveredListing(null),
              click: () => handleListingClick(l),
            }}
          >
            <Popup>
              <div style={{ fontSize: 12, minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{shortPrice(l.price)}</div>
                <div style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>{l.address}</div>
                <div style={{ color: '#8892a4', fontSize: 10 }}>
                  {l.bedrooms} bed · {l.listing_type}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ) : null)

      case 'heatmap':
        return <HeatLayer points={heatPoints} />

      case 'borough':
        return londonGeoJSON ? (
          <GeoJSON data={londonGeoJSON} style={boroughGeoJSONStyle} onEachFeature={boroughGeoJSONOnEachFeature} />
        ) : null

      case 'dealScore':
        return listings.map(l => {
          if (!l.latitude || !l.longitude) return null
          const borough = boroughStats[l.district?.toLowerCase()]
          const color = dealColor(l.price, borough?.avg_price_all)
          return (
            <CircleMarker
              key={l.listing_id}
              center={[l.latitude, l.longitude]}
              radius={5}
              fillColor={color}
              color={color}
              fillOpacity={0.75}
              weight={1}
              eventHandlers={{
                mouseover: (e) => handleListingHover(l, e),
                mouseout: () => setHoveredListing(null),
                click: () => handleListingClick(l),
              }}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 140 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{shortPrice(l.price)}</div>
                  <div style={{ color: '#8892a4', fontSize: 10 }}>
                    Borough avg: {shortPrice(borough?.avg_price_all)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })

      case 'bedrooms':
        return listings.map(l => l.latitude && l.longitude ? (
          <CircleMarker
            key={l.listing_id}
            center={[l.latitude, l.longitude]}
            radius={5}
            fillColor={bedroomColor(l.bedrooms)}
            color={bedroomColor(l.bedrooms)}
            fillOpacity={0.75}
            weight={1}
            eventHandlers={{
              mouseover: (e) => handleListingHover(l, e),
              mouseout: () => setHoveredListing(null),
              click: () => handleListingClick(l),
            }}
          >
            <Popup>
              <div style={{ fontSize: 12, minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{shortPrice(l.price)}</div>
                <div style={{ color: '#8892a4', fontSize: 10 }}>
                  {l.bedrooms} bedrooms
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ) : null)

      case 'composite':
        return londonGeoJSON ? (
          <GeoJSON
            data={londonGeoJSON}
            style={(feature) => {
              const name = feature.properties?.name?.toLowerCase()
              const stats = boroughStats[name]
              const score = stats?.composite_score || 2
              return {
                color: compositeColor(score),
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.4,
                fillColor: compositeColor(score),
              }
            }}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.name
              const stats = boroughStats[name?.toLowerCase()]
              const html = `
                <div style="font-size:13px; min-width:160px">
                  <strong>${name}</strong><br/>
                  Area Score: <strong>${stats?.composite_score?.toFixed(1) || '?'}</strong> / 5<br/>
                  Price: ${shortPrice(stats?.avg_price_all)}<br/>
                  Crime Index: ${stats?.crime_per_capita?.toFixed(3) || '?'}
                </div>
              `
              layer.bindPopup(html)
            }}
          />
        ) : null

      default:
        return null
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#f5f6fa' }}>
      <MapContainer
        center={[51.5074, -0.1278]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {layerContent()}

        {/* UI Overlays that need useMap() must be inside MapContainer */}
        <PostcodeSearch />
      </MapContainer>

      {/* UI Overlays outside MapContainer */}
      <LayerControl activeLayer={activeLayer} onLayerChange={setActiveLayer} />
      <MapLegend activeLayer={activeLayer} meta={{ minPrice, midPrice: (minPrice + maxPrice) / 2, maxPrice }} />
      <HoverCard listing={hoveredListing} position={hoverPos} />

      {/* Side panel */}
      {selectedListing && (
        <SidePanel
          listing={selectedListing}
          boroughStatsMap={boroughStats}
          onClose={() => setSelectedListing(null)}
        />
      )}

      {/* Loading indicator */}
      {listingsLoading && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: '#fff', padding: '6px 14px', borderRadius: 20,
          fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>Loading map data…</div>
      )}

      {/* Listing count */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20, zIndex: 1000,
        background: '#fff', padding: '8px 14px', borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12, color: '#555',
      }}>
        {listings.length} listings shown
      </div>

      {/* CSS for slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
