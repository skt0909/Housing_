import { useState, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useFilters } from '../../context/FilterContext'

export default function PostcodeSearch() {
  const map = useMap()
  const { updateFilter } = useFilters()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const circleRef = useRef(null)

  async function handleSearch(e) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', London')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.length === 0) { setError('Not found'); return }
      const { lat, lon } = data[0]
      map.setView([parseFloat(lat), parseFloat(lon)], 14)

      // draw a radius circle
      if (circleRef.current) map.removeLayer(circleRef.current)
      circleRef.current = L.circle([lat, lon], {
        radius: 1000, color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.08, weight: 2,
      }).addTo(map)

      updateFilter('postcode', q)
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setValue('')
    setError('')
    updateFilter('postcode', '')
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null }
  }

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="Search postcode, e.g. SW1A"
          style={{
            padding: '8px 14px', borderRadius: '20px 0 0 20px',
            border: '1px solid #e8eaf0', borderRight: 'none',
            fontSize: 13, width: 220, outline: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: '#333',
          }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '8px 16px', borderRadius: '0 20px 20px 0',
          background: '#4f8ef7', color: '#fff', border: 'none',
          fontSize: 13, cursor: loading ? 'wait' : 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontWeight: 600,
        }}>
          {loading ? '…' : '🔍'}
        </button>
      </form>

      {(value || error) && (
        <button onClick={handleClear} style={{
          background: '#fff', border: '1px solid #e8eaf0', borderRadius: 20,
          padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>✕ Clear</button>
      )}

      {error && (
        <span style={{ fontSize: 12, color: '#ef4444', background: '#fff', padding: '4px 8px', borderRadius: 6 }}>
          {error}
        </span>
      )}
    </div>
  )
}
