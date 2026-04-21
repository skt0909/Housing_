import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FilterProvider } from './context/FilterContext'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import MapPage from './pages/Map'
import Boroughs from './pages/Boroughs'
import Listings from './pages/Listings'

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="map" element={<MapPage />} />
            <Route path="boroughs" element={<Boroughs />} />
            <Route path="listings" element={<Listings />} />
          </Route>
        </Routes>
      </FilterProvider>
    </BrowserRouter>
  )
}
