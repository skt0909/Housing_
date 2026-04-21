import { useState } from 'react'
import BoroughTable from '../components/table/BoroughTable'
import PriceByBorough from '../components/charts/PriceByBorough'

export default function Boroughs() {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1e2433' }}>Borough Analysis</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <PriceByBorough />
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1e2433' }}>
            {selected ? `Borough: ${selected}` : 'Click a row to highlight'}
          </h3>
          <p style={{ color: '#8892a4', fontSize: 13 }}>
            Select a row in the table below to highlight it. Borough codes are ONS administrative codes for London districts.
          </p>
          {selected && (
            <button onClick={() => setSelected(null)} style={{ fontSize: 12, color: '#4f8ef7', background: 'none', border: '1px solid #4f8ef7', padding: '4px 12px', borderRadius: 6, cursor: 'pointer' }}>
              Clear selection
            </button>
          )}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1e2433' }}>All Boroughs</h3>
        <BoroughTable onSelect={setSelected} selected={selected} />
      </div>
    </div>
  )
}
