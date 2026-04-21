import { shortPrice } from '../../utils/formatters'

const CONFIGS = {
  property: {
    title: 'Avg Price',
    type: 'gradient',
    stops: ['#22c55e', '#eab308', '#ef4444'],
    labels: (meta) => [shortPrice(meta?.minPrice), shortPrice(meta?.midPrice), shortPrice(meta?.maxPrice)],
  },
  heatmap: {
    title: 'Listing Density',
    type: 'gradient',
    stops: ['#3b82f6', '#eab308', '#ef4444'],
    labels: () => ['Low', 'Medium', 'High'],
  },
  borough: {
    title: 'Borough Avg Price',
    type: 'gradient',
    stops: ['#22c55e', '#eab308', '#ef4444'],
    labels: (meta) => [shortPrice(meta?.minPrice), '', shortPrice(meta?.maxPrice)],
  },
  dealScore: {
    title: 'Deal Score',
    type: 'steps',
    steps: [
      { color: '#22c55e', label: 'Undervalued  < 85%' },
      { color: '#eab308', label: 'Fair  85–115%' },
      { color: '#ef4444', label: 'Overpriced  > 115%' },
    ],
  },
  bedrooms: {
    title: 'Bedrooms',
    type: 'steps',
    steps: [
      { color: '#818cf8', label: '1–2 beds (Small)' },
      { color: '#f59e0b', label: '3–4 beds (Family)' },
      { color: '#ef4444', label: '5+ beds (Large)' },
    ],
  },
  composite: {
    title: 'Area Score (2–5)',
    type: 'gradient',
    stops: ['#ef4444', '#eab308', '#22c55e'],
    labels: () => ['2 (Fair)', '3.5', '5 (Excellent)'],
  },
}

export default function MapLegend({ activeLayer, meta }) {
  const cfg = CONFIGS[activeLayer]
  if (!cfg) return null

  return (
    <div style={{
      position: 'absolute', bottom: 30, left: 12, zIndex: 1000,
      background: 'rgba(255,255,255,0.95)', borderRadius: 10,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)', padding: '10px 14px', minWidth: 160,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#1e2433', marginBottom: 8 }}>{cfg.title}</div>

      {cfg.type === 'gradient' && (
        <>
          <div style={{
            height: 10, borderRadius: 5,
            background: `linear-gradient(to right, ${cfg.stops.join(', ')})`,
            marginBottom: 4,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8892a4' }}>
            {cfg.labels(meta).map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </>
      )}

      {cfg.type === 'steps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {cfg.steps.map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#444' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
