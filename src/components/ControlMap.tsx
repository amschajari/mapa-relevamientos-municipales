import { useEffect, useCallback, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Tooltip, Popup } from 'react-leaflet'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import type { GeoJsonObject } from 'geojson'
import type { Barrio, TareaRelevamiento } from '@/types'
import { useBarrioStore } from '@/stores/barrioStore'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { BarrioPopup } from './BarrioPopup'
import { LayerControl } from './LayerControl'

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

const DiscoveryLayer = () => {
  const { discoveryPoints, visibleLayers } = useBarrioStore()
  
  if (!visibleLayers.luminarias || !discoveryPoints || discoveryPoints.length === 0) return null

  return (
    <>
      {discoveryPoints.map((point: any, idx: number) => {
        const coords = point.geometry.coordinates
        // GeoJSON es [lng, lat], Leaflet es [lat, lng]
        const position: [number, number] = [coords[1], coords[0]]
        const properties = point.properties || {}
        const name = properties.Nombre || properties.name || properties.Name || properties.ID || properties.id || properties.label || `Punto ${idx + 1}`
        
        return (
          <CircleMarker
            key={`discovery-${idx}`}
            center={position}
            radius={5}
            pane="markerPane"
            pathOptions={{
              fillColor: '#3b82f6',
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.9,
              pane: 'markerPane' // Refuerzo para Leaflet
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={1}
              permanent={false}
              sticky={true}
              pane="tooltipPane"
            >
              <div className="px-2 py-1">
                <div className="text-sm font-black text-primary-700">{name}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-tighter">Punto de Descubrimiento</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

// Capa para visualizar puntos oficiales persistentes en Supabase
const OfficialPointsLayer = () => {
  const { officialPoints, visibleLayers, fetchOfficialPoints } = useBarrioStore()

  useEffect(() => {
    fetchOfficialPoints()
  }, [fetchOfficialPoints])

  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'w-8 h-8';
    if (count > 50) size = 'w-10 h-10';
    if (count > 100) size = 'w-12 h-12';

    return L.divIcon({
      html: `
        <div class="flex items-center justify-center ${size} bg-amber-500/20 rounded-full border-2 border-amber-500 shadow-lg backdrop-blur-sm animate-pulse-slow">
          <div class="flex items-center justify-center w-full h-full bg-amber-500 rounded-full text-white text-xs font-black shadow-inner">
            ${count}
          </div>
        </div>
      `,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };
  
  if (!visibleLayers.luminarias || !officialPoints || officialPoints.length === 0) return null

  return (
    <MarkerClusterGroup
      key={`cluster-group-${officialPoints.length}`}
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={80}
      disableClusteringAtZoom={18}
      showCoverageOnHover={true}
      spiderfyOnMaxZoom={true}
      zoomToBoundsOnClick={true}
    >
      {officialPoints.map((point: any, idx: number) => {
        if (!point.geom) return null;
        
        let position: [number, number] = [0, 0]
        
        if (typeof point.geom === 'string' && point.geom.startsWith('POINT')) {
          const match = point.geom.match(/\((.*)\)/);
          if (match) {
            const coords = match[1].split(' ');
            position = [parseFloat(coords[1]), parseFloat(coords[0])]
          }
        } else if (point.geom.type === 'Point') {
          position = [point.geom.coordinates[1], point.geom.coordinates[0]]
        }

        const name = point.nombre || `L-${idx + 1}`
        
        return (
          <CircleMarker
            key={`official-${point.id}`}
            center={position}
            radius={5}
            pane="markerPane"
            pathOptions={{
              fillColor: '#fbbf24', // Amarillo/Ambar para oficiales (Luz)
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.9,
              pane: 'markerPane'
            }}
          >
            <Popup 
              className="luminaria-popup"
              minWidth={200}
            >
              <div className="px-2 py-2 min-w-[190px]">
                {/* Header */}
                <div className="flex items-center gap-1 border-b border-amber-100 pb-1 mb-2">
                  <span className="text-base">💡</span>
                  <div className="text-sm font-black text-amber-600 leading-tight">{name}</div>
                </div>

                {/* Campos enriquecidos */}
                {/* Campos enriquecidos */}
                <div className="space-y-1 text-xs text-gray-700">
                  {/* Leer de `propiedades` (JSONB) con fallback en raíz del objeto */}
                  {(() => {
                    const props = point.propiedades || {}
                    const direccion = props.direccion || point.direccion || ''
                    const barrioNombre = props.barrio || point.barrio_nombre || ''
                    const tipo = props.tipo || props.tipo_luminaria || point.tipo_luminaria || ''
                    const estadoBase = props.estado_base || point.estado_base || ''
                    const sinLuzRaw = props.sin_luz ?? point.sin_luz
                    const sinLuz = sinLuzRaw === true || sinLuzRaw === 'True' || sinLuzRaw === 'true'

                    return (
                      <>
                        {direccion && (
                          <div className="flex items-start gap-1">
                            <span className="text-gray-400 w-4 shrink-0">📍</span>
                            <span>{direccion}</span>
                          </div>
                        )}
                        {barrioNombre && (
                          <div className="flex items-start gap-1">
                            <span className="text-gray-400 w-4 shrink-0">🏘️</span>
                            <span>{barrioNombre}</span>
                          </div>
                        )}
                        {tipo && (
                          <div className="flex items-start gap-1">
                            <span className="text-gray-400 w-4 shrink-0">⚡</span>
                            <span>{tipo}</span>
                          </div>
                        )}
                        {estadoBase && (
                          <div className="flex items-start gap-1">
                            <span className="text-gray-400 w-4 shrink-0">🔩</span>
                            <span className={estadoBase.toLowerCase().includes('deteriorada') ? 'text-red-500 font-semibold' : 'text-green-600'}>
                              {estadoBase}
                            </span>
                          </div>
                        )}
                        {sinLuz && (
                          <div className="flex items-center gap-1 bg-red-50 rounded px-1 py-0.5 mt-1">
                            <span>⚠️</span>
                            <span className="text-red-600 font-bold">Sin luz</span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Footer: Coordenadas */}
                <div className="border-t border-gray-100 pt-1 mt-2 text-[10px] text-gray-400 font-mono">
                  {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </div>
              </div>
            </Popup>

          </CircleMarker>
        )
      })}
    </MarkerClusterGroup>
  )
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
  const { getBarrioByNombre, getBarrioStatus, getBarrioProgress, setSelectedBarrio, visibleLayers } = useBarrioStore()
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
        superficie_ha: storeBarrio?.superficie_ha,
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

  return visibleLayers.barrios ? (
    <GeoJSON
      ref={geoJsonRef}
      data={geoJson}
      style={getBarrioStyle}
      onEachFeature={onEachFeature}
    />
  ) : null
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

        <OfficialPointsLayer />
        <DiscoveryLayer />

        <LayerControl />
      </MapContainer>
    </div>
  )
}
