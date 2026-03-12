import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useCallback, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
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
  onEditBarrio?: (barrio: Barrio) => void
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

// Componente para centrar un barrio seleccionado
const CenterBarrio = ({ 
  selectedBarrio, 
  geoJson 
}: { 
  selectedBarrio: Barrio | null, 
  geoJson: GeoJsonObject 
}) => {
  const map = useMap()

  useEffect(() => {
    if (selectedBarrio && geoJson) {
      const feature = (geoJson as any).features?.find(
        (f: any) => f.properties.Nombre === selectedBarrio.nombre || f.properties.fid.toString() === selectedBarrio.id
      )

      if (feature) {
        const layer = L.geoJSON(feature)
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 })
        }
      }
    }
  }, [selectedBarrio, map, geoJson])

  return null
}

// Sub-componente para manejar la capa GeoJSON con acceso al contexto del mapa
const BarriosLayer = ({
  geoJson,
  onBarrioClick,
  selectedBarrio,
  onEditBarrio,
}: {
  geoJson: GeoJsonObject
  onBarrioClick?: (barrio: Barrio) => void
  selectedBarrio?: Barrio | null
  onEditBarrio?: (barrio: Barrio) => void
}) => {
  const map = useMap()
  const { getBarrioByNombre, getBarrioStatus, getBarrioProgress, setSelectedBarrio } = useBarrioStore()
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  // Memoizar estilos por estado para evitar recálculos
  const getBarrioStyle = useCallback(
    (feature?: any) => {
      const nombre = feature?.properties?.Nombre || ''
      const status = getBarrioStatus(nombre)
      const progress = getBarrioProgress(nombre)
      const isSelected = selectedBarrio?.nombre === nombre

      const baseStyle = {
        weight: isSelected ? 4 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.8 : 0.6,
        dashArray: isSelected ? '' : '3',
      }

      switch (status) {
        case 'completado': return { ...baseStyle, color: '#059669', fillColor: '#10b981' }
        case 'progreso':
          const intensity = Math.max(0.3, progress / 100)
          return { ...baseStyle, color: '#d97706', fillColor: `rgba(245, 158, 11, ${intensity})` }
        case 'pausado': return { ...baseStyle, color: '#dc2626', fillColor: '#ef4444' }
        case 'pendiente':
        default: return { ...baseStyle, color: '#4b5563', fillColor: '#9ca3af' }
      }
    },
    [getBarrioStatus, getBarrioProgress, selectedBarrio]
  )

  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target
    layer.setStyle({
      weight: 4,
      fillOpacity: 0.9,
    })
    layer.bringToFront()
  }

  const resetHighlight = (e: L.LeafletEvent, feature?: any) => {
    const layer = e.target
    const style = getBarrioStyle(feature)
    layer.setStyle(style)
  }

  const openPopupForBarrio = useCallback(
    (barrio: Barrio, latlng: L.LatLng) => {
      const popup = L.popup({ minWidth: 200 })
        .setLatLng(latlng)
        .setContent('<div class="popup-container"></div>')
        .openOn(map)

      const container = popup.getElement()?.querySelector('.popup-container')
      if (container) {
        const root = createRoot(container)
        root.render(<BarrioPopup barrio={barrio} onEdit={onEditBarrio} />)
      }
    },
    [map, onEditBarrio]
  )

  // Efecto para abrir el popup programáticamente cuando cambia selectedBarrio
  useEffect(() => {
    if (selectedBarrio && geoJsonRef.current) {
      let found = false
      geoJsonRef.current.eachLayer((layer: any) => {
        if (found) return
        const feature = layer.feature
        if (
          feature.properties.Nombre === selectedBarrio.nombre ||
          feature.properties.fid?.toString() === selectedBarrio.id
        ) {
          const center = layer.getBounds().getCenter()
          openPopupForBarrio(selectedBarrio, center)
          found = true
        }
      })
    }
  }, [selectedBarrio, openPopupForBarrio])

  const onEachFeature = useCallback(
    (feature: any, layer: L.Layer) => {
      const nombre = feature.properties?.Nombre || 'Sin nombre'
      const fid = feature.properties?.fid || 0

      const storeBarrio = getBarrioByNombre(nombre)

      const barrio: Barrio = {
        id: storeBarrio?.id || fid.toString(),
        nombre,
        estado: storeBarrio?.estado || 'pendiente',
        progreso: storeBarrio?.progreso || 0,
        luminariasEstimadas: storeBarrio?.luminariasEstimadas,
        luminariasRelevadas: storeBarrio?.luminariasRelevadas,
      }

      layer.on({
        mouseover: highlightFeature,
        mouseout: (e) => resetHighlight(e, feature),
        click: (e: L.LeafletMouseEvent) => {
          setSelectedBarrio(barrio)
          onBarrioClick?.(barrio)
          openPopupForBarrio(barrio, e.latlng)
        },
      })
    },
    [getBarrioByNombre, onBarrioClick, setSelectedBarrio, openPopupForBarrio]
  )

  return (
    <GeoJSON
      ref={geoJsonRef}
      data={geoJson}
      style={getBarrioStyle}
      onEachFeature={onEachFeature}
    />
  )
}

export const ControlMap = ({
  barriosGeoJson,
  onBarrioClick,
  selectedBarrio,
  onEditBarrio,
}: ControlMapProps) => {
  const center = useMemo(() => [-30.7516, -57.9872] as [number, number], [])

  return (
    <div className="h-full w-full relative">
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
        <CenterBarrio selectedBarrio={selectedBarrio || null} geoJson={barriosGeoJson} />

        <BarriosLayer 
          geoJson={barriosGeoJson}
          onBarrioClick={onBarrioClick}
          selectedBarrio={selectedBarrio}
          onEditBarrio={onEditBarrio}
        />
      </MapContainer>
    </div>
  )
}
