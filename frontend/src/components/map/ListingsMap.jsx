import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import { formatPrice } from '../../utils/formatters'

export default function ListingsMap() {
  const { toQueryParams } = useFilters()
  const params = toQueryParams()
  const { data, loading } = useApi(() => api.mapListings(params), [JSON.stringify(params)])

  const listings = data?.data ?? []

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      {loading && (
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          Loading...
        </div>
      )}
      <MapContainer
        center={[51.5074, -0.1278]}
        zoom={10}
        style={{ height: 'calc(100vh - 140px)', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map(l => (
          l.latitude && l.longitude ? (
            <CircleMarker
              key={l.listing_id}
              center={[l.latitude, l.longitude]}
              radius={6}
              fillColor={l.listing_type === 'rent' ? '#4f8ef7' : '#34c97e'}
              color={l.listing_type === 'rent' ? '#2d6fd4' : '#1fa85e'}
              fillOpacity={0.8}
              weight={1}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 160 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatPrice(l.price, l.listing_type)}</div>
                  <div style={{ color: '#555', marginBottom: 2 }}>{l.address}</div>
                  <div style={{ color: '#8892a4', fontSize: 11 }}>
                    {l.bedrooms} bed · {l.listing_type}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        ))}
      </MapContainer>
      <div style={{ position: 'absolute', bottom: 20, right: 10, zIndex: 1000, background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f8ef7', display: 'inline-block' }}></span> Rent
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c97e', display: 'inline-block' }}></span> Buy
        </div>
        <div style={{ marginTop: 6, color: '#8892a4' }}>{listings.length} listings</div>
      </div>
    </div>
  )
}
