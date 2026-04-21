import MapView from '../components/map/MapView'
import MapFilterBar from '../components/filters/MapFilterBar'

export default function MapPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MapFilterBar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView />
      </div>
    </div>
  )
}
