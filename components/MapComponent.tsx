'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapComponentProps {
  features: any[]
  onFeatureClick: (feature: any) => void
  selectedFeature: any
}

function MapBounds({ features }: { features: any[] }) {
  const map = useMap()

  useEffect(() => {
    if (features.length > 0) {
      const bounds = L.latLngBounds(
        features.flatMap(f => f.coordinates.filter((c: any) => c.length === 2))
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [features, map])

  return null
}

export default function MapComponent({ features, onFeatureClick, selectedFeature }: MapComponentProps) {
  const center: [number, number] = features.length > 0 && features[0].coordinates.length > 0
    ? features[0].coordinates[0]
    : [14.5995, 120.9842] // Default to Philippines

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds features={features} />

      {features.map((feature, idx) => {
        const isLine = feature.coordinates.length > 1
        const isSelected = selectedFeature?.name === feature.name

        if (isLine) {
          return (
            <Polyline
              key={idx}
              positions={feature.coordinates}
              pathOptions={{
                color: isSelected ? '#ef4444' : '#3b82f6',
                weight: isSelected ? 4 : 2
              }}
              eventHandlers={{
                click: () => onFeatureClick(feature)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold mb-1">{feature.name}</h3>
                  {feature.description && <p className="mb-2">{feature.description}</p>}
                  <button
                    onClick={() => onFeatureClick(feature)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Analyze with AI
                  </button>
                </div>
              </Popup>
            </Polyline>
          )
        } else {
          const position: [number, number] = feature.coordinates[0]

          const icon = isSelected
            ? new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
            : undefined

          return (
            <Marker
              key={idx}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => onFeatureClick(feature)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold mb-1">{feature.name}</h3>
                  {feature.description && <p className="mb-2">{feature.description}</p>}
                  <button
                    onClick={() => onFeatureClick(feature)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Analyze with AI
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        }
      })}
    </MapContainer>
  )
}
