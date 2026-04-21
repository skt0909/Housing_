import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { shortPrice } from '../../utils/formatters'

export default function PriceDistribution() {
  const [type, setType] = useState('rent')
  const { data, loading } = useApi(() => api.priceDistribution({ listing_type: type, buckets: 20 }), [type])

  const buckets = data?.buckets?.map(b => ({ ...b, label: shortPrice(b.range_start) })) ?? []
  const stats = data?.stats

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e2433' }}>Price Distribution</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['rent', 'buy'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
              background: type === t ? '#4f8ef7' : '#f0f2f7', color: type === t ? '#fff' : '#555',
            }}>{t === 'rent' ? 'Rent' : 'Buy'}</button>
          ))}
        </div>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['Median', shortPrice(stats.median)], ['Mean', shortPrice(stats.mean)], ['Min', shortPrice(stats.min)], ['Max', shortPrice(stats.max)]].map(([l, v]) => (
            <div key={l} style={{ fontSize: 12, color: '#555' }}><span style={{ color: '#8892a4' }}>{l}: </span>{v}</div>
          ))}
        </div>
      )}

      {loading ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892a4' }}>Loading...</div> : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={buckets} margin={{ left: 0, right: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [v, 'Listings']} labelFormatter={(l) => `From ${l}`} />
            <Bar dataKey="count" fill={type === 'rent' ? '#4f8ef7' : '#34c97e'} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
