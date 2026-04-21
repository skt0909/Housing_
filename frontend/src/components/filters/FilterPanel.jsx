import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'

export default function FilterPanel() {
  const { filters, updateFilter, resetFilters } = useFilters()
  const { data } = useApi(() => api.filterOptions(), [])

  const opts = data ?? {}
  const priceRange = opts.price_ranges?.[filters.listing_type || 'rent'] ?? { min: 0, max: 10000 }

  function toggleBed(b) {
    const curr = filters.bedrooms
    updateFilter('bedrooms', curr.includes(b) ? curr.filter(x => x !== b) : [...curr, b])
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1e2433' }}>Filters</span>
        <button onClick={resetFilters} style={{ fontSize: 11, color: '#4f8ef7', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Listing Type</label>
        <select value={filters.listing_type} onChange={e => updateFilter('listing_type', e.target.value)} style={selectStyle}>
          <option value="">All</option>
          {(opts.listing_types ?? []).map(t => <option key={t} value={t}>{t === 'rent' ? 'Rent' : 'Buy'}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Borough</label>
        <select value={filters.borough} onChange={e => updateFilter('borough', e.target.value)} style={selectStyle}>
          <option value="">All boroughs</option>
          {(opts.boroughs ?? []).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Bedrooms</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(opts.bedrooms ?? []).slice(0, 8).map(b => (
            <button key={b} onClick={() => toggleBed(b)} style={{
              padding: '3px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer', border: 'none',
              background: filters.bedrooms.includes(b) ? '#4f8ef7' : '#f0f2f7',
              color: filters.bedrooms.includes(b) ? '#fff' : '#555',
            }}>{b}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Min Price</label>
        <input type="number" value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)}
          placeholder={`${priceRange.min}`} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Max Price</label>
        <input type="number" value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)}
          placeholder={`${priceRange.max}`} style={inputStyle} />
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }
const selectStyle = { width: '100%', padding: '6px 8px', border: '1px solid #e8eaf0', borderRadius: 6, fontSize: 13, color: '#333' }
const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #e8eaf0', borderRadius: 6, fontSize: 13, color: '#333', boxSizing: 'border-box' }
