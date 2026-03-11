import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useCallback, useMemo } from 'react'
import L from 'leaflet'
import type { GeoJsonObject } from 'geojson'
import type { Barrio, TareaRelevamiento } from '@/types'
import { useBarrioStore } from '@/stores/barrioStore'
import { BarrioPopup } from './BarrioPopup'

interface ControlMapProps {
  barriosGeoJson: GeoJsonObject
  tareas?: TareaRelevamiento[]
  onBarrioClick?: (barrio: Barrio) => void
  selectedBarrio?: Barrio | null
}

// Componente para ajustar la vista a los bounds del GeoJSON
const FitBounds = ({ geoJson }: { geoJson: GeoJsonObject }) => {
  const map = useMap()

  useEffect(() => {
    const layer = L.geoJSON(geoJson)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, geoJson])

  return null
}

export const ControlMap = ({
  barriosGeoJson,
  tareas = [],
  onBarrioClick,
  selectedBarrio,
}: ControlMapProps) => {
  const { getBarrioStatus, getBarrioProgress, setSelectedBarrio } = useBarrioStore()

  // Memoizar estilos por estado para evitar recálculos
  const getBarrioStyle = useCallback(
    (feature?: { properties?: { Nombre?: string } }) => {
      const nombre = feature?.properties?.Nombre || ''
      const status = getBarrioStatus(nombre)
      const progress = getBarrioProgress(nombre)

      const baseStyle = {
        weight: 2,
        opacity: 1,
        fillOpacity: 0.6,
      }

      switch (status) {
        case 'completado':
          return {
            ...baseStyle,
            color: '#059669',
            fillColor: '#10b981',
          }
        case 'progreso':
          // Color interpolado según progreso
          const intensity = Math.max(0.3, progress / 100)
          return {
            ...baseStyle,
            color: '#d97706',
            fillColor: `rgba(245, 158, 11, ${intensity})`,
          }
        case 'pausado':
          return {
            ...baseStyle,
            color: '#dc2626',
            fillColor: '#ef4444',
          }
        case 'pendiente':
        default:
          return {
            ...baseStyle,
            color: '#6b7280',
            fillColor: '#9ca3af',
          }
      }
    },
    [getBarrioStatus, getBarrioProgress]
  )

  // Estilo cuando el mouse pasa por encima
  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target
    layer.setStyle({
      weight: 3,
      fillOpacity: 0.8,
    })
    layer.bringToFront()
  }

  // Resetear estilo
  const resetHighlight = (e: L.LeafletEvent, feature?: { properties?: { Nombre?: string } }) => {
    const layer = e.target
    const style = getBarrioStyle(feature)
    layer.setStyle(style)
  }

  // Click en barrio
  const onEachFeature = useCallback(
    (feature: { properties?: { Nombre?: string; fid?: number } }, layer: L.Layer) => {
      const nombre = feature.properties?.Nombre || 'Sin nombre'
      const fid = feature.properties?.fid || 0

      // Crear objeto Barrio
      const barrio: Barrio = {
        id: fid.toString(),
        nombre,
        estado: getBarrioStatus(nombre),
        progreso: getBarrioProgress(nombre),
      }

      // Bind popup
      const popupContent = document.createElement('div')
      layer.bindPopup(popupContent)

      layer.on({
        mouseover: highlightFeature,
        mouseout: (e) => resetHighlight(e, feature),
        click: (e) => {
          setSelectedBarrio(barrio)
          onBarrioClick?.(barrio)

          // Renderizar popup con React
          const popup = e.target.getPopup()
          if (popup) {
            popup.setContent(`
              <div id="barrio-popup-${barrio.id}"></div>
            `)
          }
        },
      })
    },
    [getBarrioStatus, getBarrioProgress, onBarrioClick, setSelectedBarrio]
  )

  // Centrar del mapa (Chajarí)
  const center = useMemo(() => [-30.7516, -57.9872] as [number, number], [])

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds geoJson={barriosGeoJson} />

      <GeoJSON
        data={barriosGeoJson}
        style={getBarrioStyle}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  )
}
