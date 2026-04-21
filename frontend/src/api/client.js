const BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  get: (path) => apiFetch(path),
  status: () => apiFetch('/api/status'),
  kpis: () => apiFetch('/api/analytics/kpis'),
  listings: (params = {}) => apiFetch('/api/listings?' + new URLSearchParams(params)),
  mapListings: (params = {}) => apiFetch('/api/listings/map?' + new URLSearchParams(params)),
  boroughs: () => apiFetch('/api/boroughs'),
  filterOptions: () => apiFetch('/api/filters/options'),
  priceDistribution: (params = {}) => apiFetch('/api/analytics/price-distribution?' + new URLSearchParams(params)),
  priceByBorough: (params = {}) => apiFetch('/api/analytics/price-by-borough?' + new URLSearchParams(params)),
  priceByBedrooms: (params = {}) => apiFetch('/api/analytics/price-by-bedrooms?' + new URLSearchParams(params)),
  mapBoroughStats: () => apiFetch('/api/analytics/map-borough-stats'),
  transportNearby: (lat, lon) => apiFetch(`/api/transport-nearby?lat=${lat}&lon=${lon}`),
}
