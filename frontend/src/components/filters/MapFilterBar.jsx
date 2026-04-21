import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'

const RENT_COLOR = '#4f8ef7'
const BUY_COLOR  = '#34c97e'

export default function MapFilterBar() {
  const { filters, updateFilter, resetFilters } = useFilters()
  const { data } = useApi(() => api.filterOptions(), [])
  const opts = data ?? {}

  function toggleBed(b) {
    const curr = filters.bedrooms
    updateFilter('bedrooms', curr.includes(b) ? curr.filter(x => x !== b) : [...curr, b])
  }

  const activeColor = filters.listing_type === 'buy' ? BUY_COLOR : RENT_COLOR

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e8eaf0',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Listing Type toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Type</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: '', label: 'All' }, { v: 'rent', label: 'Rent' }, { v: 'buy', label: 'Buy' }].map(({ v, label }) => {
            const isActive = filters.listing_type === v
            const bg = isActive ? (v === 'buy' ? BUY_COLOR : v === 'rent' ? RENT_COLOR : '#1e2433') : '#f0f2f7'
            return (
              <button key={v} onClick={() => updateFilter('listing_type', v)} style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: isActive ? 600 : 500,
                background: bg, color: isActive ? '#fff' : '#555',
                transition: 'all 0.15s ease',
              }}>{label}</button>
            )
          })}
        </div>
      </div>

      {/* Bedrooms */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Beds</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {(opts.bedrooms ?? []).slice(0, 7).map(b => (
            <button key={b} onClick={() => toggleBed(b)} style={{
              width: 30, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
              background: filters.bedrooms.includes(b) ? activeColor : '#f0f2f7',
              color: filters.bedrooms.includes(b) ? '#fff' : '#555',
              fontWeight: filters.bedrooms.includes(b) ? 600 : 400,
              transition: 'all 0.15s ease',
            }}>{b}</button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Price</span>
        <input
          type="number"
          value={filters.min_price}
          onChange={e => updateFilter('min_price', e.target.value)}
          placeholder="Min"
          style={inputStyle}
        />
        <span style={{ color: '#aaa', fontSize: 11 }}>—</span>
        <input
          type="number"
          value={filters.max_price}
          onChange={e => updateFilter('max_price', e.target.value)}
          placeholder="Max"
          style={inputStyle}
        />
      </div>

      {/* Borough */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Borough</span>
        <select
          value={filters.borough}
          onChange={e => updateFilter('borough', e.target.value)}
          style={{ ...inputStyle, width: 160, cursor: 'pointer' }}
        >
          <option value="">All boroughs</option>
          {(opts.boroughs ?? []).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Reset */}
      <button onClick={resetFilters} style={{
        marginLeft: 'auto', fontSize: 11, color: '#8892a4', background: 'none',
        border: '1px solid #e8eaf0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
      }}>Reset</button>
    </div>
  )
}

const labelStyle = { fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, whiteSpace: 'nowrap' }
const inputStyle  = { padding: '4px 8px', border: '1px solid #e8eaf0', borderRadius: 6, fontSize: 12, width: 80, color: '#333' }
