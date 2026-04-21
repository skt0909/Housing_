export default function KPICard({
  variant = 'stat',
  label,
  value,
  sub,
  color = '#3B82F6',
  badge,
  badgeLabel,
  style = {}
}) {
  if (variant === 'hero') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #2170e4 100%)',
        borderRadius: 12,
        padding: 32,
        color: '#fff',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}>
        <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.1, fontSize: 180, transform: 'scale(1.1)' }}>🏢</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase', opacity: 0.8, marginBottom: 16 }}>{label}</div>
          <div style={{ fontSize: 56, fontWeight: 600, lineHeight: 1 }}>{value}</div>
        </div>
        {badge && (
          <div style={{ marginTop: 32, display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
            <div style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8, backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>{badge}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{badgeLabel}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'standard') {
    return (
      <div style={{
        background: '#dce2f7',
        borderRadius: 12,
        padding: 24,
        borderTop: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#424754', marginBottom: 16 }}>{label}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#141b2b' }}>{value}</div>
        </div>
        {sub && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(66, 71, 84, 0.18)', fontSize: 10, color: '#424754' }}>
            {sub}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'stat') {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 24,
        borderTop: `4px solid ${color}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#424754', marginBottom: 16 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#141b2b' }}>{value}</div>
        </div>
        {sub && (
          <div style={{ marginTop: 16, fontSize: 10, color: '#727785' }}>{sub}</div>
        )}
      </div>
    )
  }

  if (variant === 'wide') {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 32,
        borderLeft: '8px solid #3B82F6',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        ...style,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase', color: '#727785', marginBottom: 8 }}>{label}</div>
          <h3 style={{ fontSize: 36, fontWeight: 900, color: '#141b2b', margin: 0, letterSpacing: -0.5 }}>{value}</h3>
          {badge && (
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: '#b6ccff', color: '#405682', fontSize: 11, fontWeight: 700, borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              ✓ {badge}
            </div>
          )}
        </div>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
          📍
        </div>
      </div>
    )
  }

  return null
}
