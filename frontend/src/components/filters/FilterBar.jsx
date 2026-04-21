import { useFilters } from '../../context/FilterContext'

export default function FilterBar() {
  const { filters, updateFilter } = useFilters()

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      background: '#fff',
      borderBottom: '1px solid #e8eaf0',
      padding: '16px 24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Listing Type
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['rent', 'buy'].map(type => (
            <button
              key={type}
              onClick={() => updateFilter('listing_type', type)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filters.listing_type === type ? 600 : 500,
                background: filters.listing_type === type
                  ? (type === 'rent' ? '#4f8ef7' : '#34c97e')
                  : '#f0f2f7',
                color: filters.listing_type === type ? '#fff' : '#555',
                transition: 'all 0.2s ease',
              }}
            >
              {type === 'rent' ? 'Rent' : 'Buy'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
