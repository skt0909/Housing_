import FilterPanel from '../components/filters/FilterPanel'
import ListingsTable from '../components/table/ListingsTable'

export default function Listings() {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1e2433' }}>Listings</h2>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <FilterPanel />
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <ListingsTable />
        </div>
      </div>
    </div>
  )
}
