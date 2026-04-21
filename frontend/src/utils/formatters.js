export function formatPrice(price, type = 'rent') {
  if (price == null) return 'N/A'
  if (type === 'rent') return `£${price.toLocaleString()}/mo`
  return `£${price.toLocaleString()}`
}

export function formatNumber(n) {
  if (n == null) return 'N/A'
  return Number(n).toLocaleString()
}

export function formatDate(d) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function shortPrice(price) {
  if (price == null) return 'N/A'
  if (price >= 1_000_000) return `£${(price / 1_000_000).toFixed(1)}M`
  if (price >= 1_000) return `£${(price / 1_000).toFixed(0)}K`
  return `£${price}`
}
