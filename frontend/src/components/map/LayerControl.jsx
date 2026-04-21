const LAYERS = [
  { id: 'property',  label: 'Property Prices', icon: '◉' },
  { id: 'heatmap',   label: 'Density Heat',    icon: '🌡' },
  { id: 'borough',   label: 'Borough Prices',  icon: '◈' },
  { id: 'dealScore', label: 'Deal Score',       icon: '★' },
  { id: 'bedrooms',  label: 'Bedrooms',         icon: '⊞' },
  { id: 'composite', label: 'Area Score',       icon: '◆' },
]

export default function LayerControl({ activeLayer, onLayerChange }) {
  return (
    <div style={{
      position: 'absolute', top: 80, left: 12, zIndex: 1000,
      background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160,
    }}>
      <div style={{ fontSize: 10, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, padding: '0 8px 6px', borderBottom: '1px solid #f0f2f7', marginBottom: 2 }}>
        Map Layer
      </div>
      {LAYERS.map(({ id, label, icon }) => {
        const isActive = activeLayer === id
        return (
          <button key={id} onClick={() => onLayerChange(id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: isActive ? '#eff6ff' : 'transparent',
            color: isActive ? '#4f8ef7' : '#444',
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            textAlign: 'left', width: '100%',
            borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
            transition: 'all 0.15s ease',
          }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
