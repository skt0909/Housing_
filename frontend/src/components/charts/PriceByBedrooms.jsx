import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import { shortPrice } from '../../utils/formatters'

export default function PriceByBedrooms() {
  const { filters } = useFilters()
  const type = filters.listing_type || 'rent'
  const { data, loading } = useApi(() => api.priceByBedrooms({ type }), [type])

  const barColor = '#3B82F6'

  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map(r => ({
      bedrooms: `${r.bedrooms} bed${r.bedrooms !== 1 ? 's' : ''}`,
      avg_price: Number(r.avg_price),
      count: r.count,
    }))
  }, [data])

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, border: '1px solid #dce2f7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#141b2b' }}>Price by Bedrooms</h3>
        <span style={{ fontSize: 24 }}>📊</span>
      </div>
      {loading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892a4' }}>Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
            <XAxis dataKey="bedrooms" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={shortPrice} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [shortPrice(v), 'Avg Price']} />
            <Bar dataKey="avg_price" fill={barColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
