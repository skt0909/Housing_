import { useApi } from '../hooks/useApi'
import { api } from '../api/client'
import { useFilters } from '../context/FilterContext'
import KPICard from '../components/cards/KPICard'
import PriceByBorough from '../components/charts/PriceByBorough'
import PriceByBedrooms from '../components/charts/PriceByBedrooms'
import { shortPrice, formatNumber } from '../utils/formatters'

export default function Overview() {
  const { filters } = useFilters()
  const { data: kpis, loading } = useApi(() => api.kpis(), [])

  const type = filters.listing_type || 'rent'
  const avgPrice = type === 'rent' ? kpis?.avg_rent_price : kpis?.avg_buy_price
  const avgPricePerBedroom = type === 'rent' ? kpis?.avg_price_per_bedroom_rent : kpis?.avg_price_per_bedroom_buy

  const cards = [
    { variant: 'hero', label: 'Total Listings', value: formatNumber(kpis?.total_listings), badge: 'Marketwide', badgeLabel: 'Active', colSpan: 4 },
    { variant: 'standard', label: 'Rental Listings', value: formatNumber(kpis?.total_rent), sub: 'Active property lets', color: '#3B82F6', colSpan: 4 },
    { variant: 'standard', label: 'Buy Listings', value: formatNumber(kpis?.total_buy), sub: 'Properties for sale', color: '#495e8a', colSpan: 4 },
    { variant: 'stat', label: 'Median Rent', value: kpis?.median_rent_price ? `£${kpis.median_rent_price.toLocaleString()}` : '—', sub: 'per month', color: '#924700', colSpan: 3 },
    { variant: 'stat', label: 'Median Buy Price', value: shortPrice(kpis?.median_buy_price), color: '#3B82F6', colSpan: 3 },
    { variant: 'stat', label: 'Avg Price', value: shortPrice(avgPrice), color: '#495e8a', colSpan: 3 },
    { variant: 'stat', label: 'Avg Price / Bedroom', value: shortPrice(avgPricePerBedroom), color: '#727785', colSpan: 3 },
    { variant: 'wide', label: 'Most Expensive Borough', value: kpis?.most_expensive_borough ?? '—', badge: 'London', colSpan: 12 },
  ]

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      {/* Top row: KPI Cards Grid (12 column) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 32 }}>
        {loading
          ? Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 32, height: 120 }} />
          ))
          : cards.map(card => (
            <div key={card.label} style={{ gridColumn: `span ${card.colSpan}` }}>
              <KPICard {...card} />
            </div>
          ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 32 }}>
        <div style={{ gridColumn: 'span 8' }}>
          <PriceByBorough />
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <PriceByBedrooms />
        </div>
      </div>
    </div>
  )
}
