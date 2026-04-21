import { shortPrice } from '../../utils/formatters'

export default function HoverCard({ listing, position }) {
  if (!listing || !position) return null

  const isRent = listing.listing_type === 'rent'
  const typeColor = isRent ? '#4f8ef7' : '#34c97e'

  return (
    <div style={{
      position: 'absolute',
      left: position.x + 14,
      top: position.y - 10,
      zIndex: 2000,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      padding: '10px 14px',
      minWidth: 180,
      pointerEvents: 'none',
      borderLeft: `3px solid ${typeColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e2433' }}>
          {shortPrice(listing.price)}{isRent ? '/mo' : ''}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
          background: isRent ? '#eff6ff' : '#f0fdf4', color: typeColor, textTransform: 'uppercase',
        }}>{listing.listing_type}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
        {listing.bedrooms != null && (
          <span style={tagStyle}>🛏 {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
        )}
        {listing.bathrooms != null && (
          <span style={tagStyle}>🚿 {listing.bathrooms} bath</span>
        )}
      </div>

      {listing.district && (
        <div style={{ fontSize: 11, color: '#8892a4', marginTop: 4 }}>📍 {listing.district}</div>
      )}

      <div style={{ fontSize: 10, color: '#bbb', marginTop: 6, fontStyle: 'italic' }}>
        Click for transport & details
      </div>
    </div>
  )
}

const tagStyle = { fontSize: 11, color: '#555', background: '#f5f6fa', padding: '2px 6px', borderRadius: 4 }
