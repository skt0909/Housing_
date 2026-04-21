import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { shortPrice } from '../../utils/formatters'

export default function SidePanel({ listing, boroughStatsMap, onClose }) {
  const [transport, setTransport] = useState(null)
  const [transportLoading, setTransportLoading] = useState(false)

  const isRent  = listing?.listing_type === 'rent'
  const typeColor = isRent ? '#4f8ef7' : '#34c97e'
  const borough = boroughStatsMap?.[listing?.district?.toLowerCase()] ?? null

  useEffect(() => {
    if (!listing?.latitude || !listing?.longitude) return
    setTransport(null)
    setTransportLoading(true)
    api.transportNearby(listing.latitude, listing.longitude)
      .then(d => setTransport(d))
      .catch(() => setTransport({ error: true }))
      .finally(() => setTransportLoading(false))
  }, [listing?.listing_id])

  if (!listing) return null

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 300, background: '#fff',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
      zIndex: 1500, overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
      animation: 'slideIn 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f2f7', borderLeft: `4px solid ${typeColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e2433' }}>
              {shortPrice(listing.price)}{isRent ? '/mo' : ''}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, marginTop: 4,
              display: 'inline-block', background: isRent ? '#eff6ff' : '#f0fdf4', color: typeColor,
            }}>{listing.listing_type?.toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{
            background: '#f0f2f7', border: 'none', borderRadius: '50%', width: 28, height: 28,
            cursor: 'pointer', fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Property details */}
        <Section title="Property">
          {listing.address && <Row icon="📍" label="Address" value={listing.address} />}
          <Row icon="🛏" label="Bedrooms" value={listing.bedrooms ?? '—'} />
          <Row icon="🚿" label="Bathrooms" value={listing.bathrooms ?? '—'} />
          <Row icon="📮" label="Postcode" value={listing.postcode ?? '—'} />
          {listing.district && <Row icon="🏙" label="Borough" value={listing.district} />}
        </Section>

        {/* Borough stats */}
        {borough && (
          <Section title="Area Stats">
            <Row icon="🏷" label="Avg Rent"  value={borough.avg_price_rent  ? shortPrice(borough.avg_price_rent)  + '/mo' : '—'} />
            <Row icon="🏷" label="Avg Buy"   value={borough.avg_price_buy   ? shortPrice(borough.avg_price_buy)         : '—'} />
            <Row icon="🔒" label="Crime Index" value={borough.crime_per_capita ? borough.crime_per_capita.toFixed(3) : '—'} />
            <Row icon="⭐" label="Area Score"
              value={
                <span style={{
                  fontWeight: 700,
                  color: borough.composite_score >= 4 ? '#22c55e' : borough.composite_score >= 3 ? '#eab308' : '#ef4444',
                }}>
                  {borough.composite_score?.toFixed(1)} / 5
                </span>
              }
            />
          </Section>
        )}

        {/* Transport */}
        <Section title="Nearest Transport">
          {transportLoading ? (
            <div style={{ fontSize: 12, color: '#8892a4', padding: '4px 0' }}>Fetching from TFL…</div>
          ) : transport?.error ? (
            <div style={{ fontSize: 12, color: '#f87171' }}>TFL data unavailable</div>
          ) : transport ? (
            <>
              <Row icon="🚇" label="Station"
                value={transport.station
                  ? `${transport.station} (${transport.station_distance_m}m)`
                  : 'None within 1km'} />
              <Row icon="🚌" label="Bus Stop"
                value={transport.bus_stop
                  ? `${transport.bus_stop} (${transport.bus_stop_distance_m}m)`
                  : 'None within 1km'} />
            </>
          ) : null}
        </Section>

        {/* Amenities */}
        <Section title="Nearby Amenities">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '🏫', label: 'Schools',    v: listing.num_schools },
              { icon: '🍽', label: 'Restaurants', v: listing.num_restaurants },
              { icon: '🛍', label: 'Shops',       v: listing.num_shops },
              { icon: '🏪', label: 'Amenities',   v: listing.num_amenities },
            ].map(({ icon, label, v }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e2433' }}>{v ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#8892a4' }}>{label}</div>
              </div>
            ))}
          </div>
          {(listing.num_amenities === 0 || listing.num_amenities == null) && (
            <div style={{ fontSize: 10, color: '#bbb', marginTop: 6, fontStyle: 'italic' }}>
              Amenity data pending enrichment
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12 }}>
      <span style={{ color: '#8892a4' }}>{icon} {label}</span>
      <span style={{ color: '#1e2433', fontWeight: 500, textAlign: 'right', maxWidth: 160 }}>{value}</span>
    </div>
  )
}
