import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { api } from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import { shortPrice } from '../../utils/formatters'

export default function PriceByBorough() {
  const { filters } = useFilters()
  const type = filters.listing_type || 'rent'
  const { data, loading } = useApi(() => api.priceByBorough({ type }), [type])

  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data
      .sort((a, b) => b.avg_price - a.avg_price)
      .slice(0, 15)
      .map(r => ({ borough: r.borough_name, avg_price: Number(r.avg_price), count: r.count }))
  }, [data])

  const barColor = '#3B82F6'

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, border: '1px solid #dce2f7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#141b2b' }}>Avg Price by Borough</h3>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#727785' }}>Top performing districts by transaction value</p>
        </div>
      </div>
      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892a4' }}>Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" horizontal={false} />
            <XAxis type="number" tickFormatter={shortPrice} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="borough" tick={{ fontSize: 11 }} width={75} />
            <Tooltip formatter={(v) => [shortPrice(v), 'Avg Price']} />
            <Bar dataKey="avg_price" fill={barColor} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
