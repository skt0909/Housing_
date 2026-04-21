import { NavLink, Outlet } from 'react-router-dom'
import { useStatus } from '../../hooks/useStatus'
import { useFilters } from '../../context/FilterContext'
import { formatDate } from '../../utils/formatters'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/boroughs', label: 'Analytics', icon: 'query_stats' },
  { to: '/listings', label: 'Listings', icon: 'groups' },
]

export default function Layout() {
  const { status, hasNewData, acknowledgeNewData } = useStatus()
  const { filters, updateFilter } = useFilters()

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f9f9ff' }}>
      {/* Sidebar */}
      <aside style={{ width: 256, background: '#293040', color: '#fff', display: 'flex', flexDirection: 'column', padding: '32px 0' }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, color: '#fff' }}>📍</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>HOUSING INFO</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e0', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>London Region</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 24px', textDecoration: 'none',
                color: isActive ? '#3B82F6' : '#cbd5e0',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderRight: isActive ? '4px solid #3B82F6' : '4px solid transparent',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 20 }}>
                {icon === 'dashboard' && '📊'}
                {icon === 'map' && '🗺️'}
                {icon === 'query_stats' && '📈'}
                {icon === 'groups' && '👥'}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: '#cbd5e0' }}>
          {status ? (
            <>
              <div>{status.total_listings?.toLocaleString()} listings</div>
              <div style={{ marginTop: 4 }}>Updated: {formatDate(status.last_updated)}</div>
            </>
          ) : 'Loading...'}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {hasNewData && (
          <div style={{ background: '#3B82F6', color: '#fff', padding: '8px 24px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>New data available — refresh to see latest listings</span>
            <button onClick={acknowledgeNewData} style={{ background: 'none', border: '1px solid #fff', color: '#fff', padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Dismiss</button>
          </div>
        )}

        {/* Sticky Header */}
        <header style={{ position: 'sticky', top: 0, left: 0, right: 0, zIndex: 40, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 32, paddingRight: 32, paddingTop: 16, paddingBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1e40af', margin: 0, letterSpacing: -0.5 }}>London Property Ledger</h1>
            <div style={{ display: 'flex', background: '#f1f3ff', padding: 4, borderRadius: 999, gap: 0 }}>
              {['rent', 'buy'].map(type => (
                <button
                  key={type}
                  onClick={() => updateFilter('listing_type', type)}
                  style={{
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: filters.listing_type === type ? 700 : 500,
                    background: filters.listing_type === type ? '#fff' : 'transparent',
                    color: filters.listing_type === type ? '#3B82F6' : '#727785',
                    boxShadow: filters.listing_type === type ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {type === 'rent' ? 'Rent' : 'Buy'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
