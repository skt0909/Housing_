import { createContext, useContext, useState } from 'react'

const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    listing_type: '',
    bedrooms: [],
    borough: '',
    min_price: '',
    max_price: '',
    postcode: '',
  })

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({ listing_type: '', bedrooms: [], borough: '', min_price: '', max_price: '', postcode: '' })
  }

  function toQueryParams() {
    const p = {}
    if (filters.listing_type) p.listing_type = filters.listing_type
    if (filters.bedrooms.length) p.bedrooms = filters.bedrooms.join(',')
    if (filters.borough) p.borough = filters.borough
    if (filters.min_price) p.min_price = filters.min_price
    if (filters.max_price) p.max_price = filters.max_price
    if (filters.postcode) p.postcode = filters.postcode
    return p
  }

  return (
    <FilterContext.Provider value={{ filters, updateFilter, resetFilters, toQueryParams }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  return useContext(FilterContext)
}
