import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import { formatPrice, formatDate } from '../../utils/formatters'

const COLS = [
  { key: 'address', label: 'Address' },
  { key: 'listing_type', label: 'Type' },
  { key: 'price', label: 'Price', sort: true },
  { key: 'bedrooms', label: 'Beds', sort: true },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'district', label: 'District' },
  { key: 'listing_date', label: 'Date', sort: true },
  { key: 'num_amenities', label: 'Amenities' },
]

export default function ListingsTable() {
  const { toQueryParams } = useFilters()
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('listing_date')
  const [sortDir, setSortDir] = useState('desc')

  const params = { ...toQueryParams(), page, per_page: 50, sort_by: sortBy, sort_dir: sortDir }
  const { data, loading } = useApi(() => api.listings(params), [JSON.stringify(params)])

  function toggleSort(key) {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
    setPage(1)
  }

  const rows = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f6fa' }}>
              {COLS.map(col => (
                <th key={col.key}
                  onClick={col.sort ? () => toggleSort(col.key) : undefined}
                  style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', cursor: col.sort ? 'pointer' : 'default', whiteSpace: 'nowrap', borderBottom: '2px solid #e8eaf0' }}>
                  {col.label} {col.sort && sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length} style={{ padding: 24, textAlign: 'center', color: '#8892a4' }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={COLS.length} style={{ padding: 24, textAlign: 'center', color: '#8892a4' }}>No listings match your filters</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.listing_id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f0f2f7' }}>
                <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.address}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: r.listing_type === 'rent' ? '#e8f0ff' : '#e8fff4', color: r.listing_type === 'rent' ? '#4f8ef7' : '#34c97e', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                    {r.listing_type}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{formatPrice(r.price, r.listing_type)}</td>
                <td style={{ padding: '8px 12px' }}>{r.bedrooms ?? '—'}</td>
                <td style={{ padding: '8px 12px' }}>{r.bathrooms ?? '—'}</td>
                <td style={{ padding: '8px 12px', color: '#555' }}>{r.district}</td>
                <td style={{ padding: '8px 12px', color: '#8892a4' }}>{formatDate(r.listing_date)}</td>
                <td style={{ padding: '8px 12px' }}>{r.num_amenities ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '4px 12px', border: '1px solid #e8eaf0', borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', background: '#fff' }}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: '#555' }}>Page {page} of {pagination.pages} ({pagination.total.toLocaleString()} total)</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            style={{ padding: '4px 12px', border: '1px solid #e8eaf0', borderRadius: 4, cursor: page === pagination.pages ? 'default' : 'pointer', background: '#fff' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
