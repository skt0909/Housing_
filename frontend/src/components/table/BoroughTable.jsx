import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { formatNumber, shortPrice } from '../../utils/formatters'

const COLS = [
  { key: 'borough_name', label: 'Borough' },
  { key: 'avg_price', label: 'Avg Price' },
  { key: 'population', label: 'Population' },
  { key: 'crime_per_capita', label: 'Crime/Capita' },
  { key: 'amenity_count', label: 'Amenities' },
  { key: 'amenity_diversity', label: 'Diversity' },
]

export default function BoroughTable({ onSelect, selected }) {
  const { data, loading } = useApi(() => api.boroughs(), [])
  const [sortBy, setSortBy] = useState('borough_name')
  const [sortDir, setSortDir] = useState('asc')

  function toggleSort(key) {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
  }

  const rows = [...(data?.data ?? [])].sort((a, b) => {
    const va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  function fmt(key, val) {
    if (val == null || isNaN(val)) return '—'
    if (key === 'avg_price') return shortPrice(val)
    if (key === 'crime_per_capita' || key === 'amenity_diversity') return Number(val).toFixed(3)
    return formatNumber(val)
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f5f6fa' }}>
            {COLS.map(col => (
              <th key={col.key} onClick={() => toggleSort(col.key)} style={{
                padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555',
                cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid #e8eaf0',
              }}>
                {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={COLS.length} style={{ padding: 24, textAlign: 'center', color: '#8892a4' }}>Loading...</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.borough_name}
              onClick={() => onSelect?.(r.borough_name)}
              style={{
                background: selected === r.borough_name ? '#eef3ff' : i % 2 === 0 ? '#fff' : '#fafbfc',
                borderBottom: '1px solid #f0f2f7', cursor: 'pointer',
              }}>
              {COLS.map(col => (
                <td key={col.key} style={{ padding: '8px 12px', fontWeight: col.key === 'borough_name' ? 600 : 400 }}>
                  {fmt(col.key, r[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
