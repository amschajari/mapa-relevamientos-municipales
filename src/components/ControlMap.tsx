import { useEffect, useCallback, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup } from 'react-leaflet'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet.heat'
import type { GeoJsonObject } from 'geojson'
import type { Barrio, TareaRelevamiento } from '@/types'
import { useBarrioStore } from '@/stores/barrioStore'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { BarrioPopup } from './BarrioPopup'
import { cn } from '@/lib/utils'
import { LayerControl } from './LayerControl'
import { MobileMapControls } from './MobileMapControls'

interface ControlMapProps {
  barriosGeoJson: GeoJsonObject
  tareas?: TareaRelevamiento[]
  onBarrioClick?: (barrio: Barrio) => void
  selectedBarrio?: Barrio | null
  onEditBarrio?: (barrio: Barrio) => void
}

// Componente para el Mapa de Calor con alto rendimiento
const HeatmapLayer = ({ points, totalPoints }: { points: any[], totalPoints: number }) => {
  const map = useMap()
  const heatLayerRef = useRef<any>(null)

  // Helper para parsear coordenadas de forma segura
  const parseCoords = (geom: any): [number, number] | null => {
    try {
      if (typeof geom === 'string' && geom.startsWith('POINT')) {
        const match = geom.match(/\(([^)]+)\)/)
        if (match?.[1]) {
          const [lon, lat] = match[1].split(' ').map(Number)
          if (!isNaN(lat) && !isNaN(lon)) return [lat, lon]
        }
      } else if (geom?.type === 'Point' && Array.isArray(geom.coordinates)) {
        return [geom.coordinates[1], geom.coordinates[0]]
      }
    } catch (e) {
      console.error('Error parseando geometría:', e)
    }
    return null
  }

  // Memoizar los puntos procesados para evitar mapeos innecesarios
  const heatData = useMemo(() => {
    if (!points || points.length === 0) return []
    if (points.length > 5000) return [] // Threshold de seguridad

    // Calcular ratio de visualización (qué tanto del total estamos viendo)
    const ratio = totalPoints > 0 ? points.length / totalPoints : 1
    
    // Intensidad inversamente proporcional al ratio:
    // Si vemos pocos puntos (ratio bajo), subimos la intensidad (0.9)
    // Si vemos muchos puntos (ratio alto), bajamos la intensidad (0.4)
    const intensity = ratio < 0.3 ? 0.9 : (ratio < 0.7 ? 0.6 : 0.4)
    
    return points
      .map(p => {
        const coords = parseCoords(p.geom)
        return coords ? [...coords, intensity] : null
      })
      .filter((p): p is [number, number, number] => p !== null)
  }, [points, totalPoints])

  useEffect(() => {
    if (heatData.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      return
    }

    const ratio = totalPoints > 0 ? points.length / totalPoints : 1
    const dynamicRadius = ratio < 0.4 ? 30 : 22

    if (!heatLayerRef.current) {
      // Inicialización única
      heatLayerRef.current = (L as any).heatLayer(heatData, {
        radius: dynamicRadius,
        blur: 15,
        maxZoom: 18,
        gradient: { 
          0.4: '#fde047', // Amarillo
          0.6: '#f97316', // Naranja
          0.8: '#ef4444', // Rojo
          1.0: '#991b1b'  // Rojo Sangre
        }
      }).addTo(map)
    } else {
      // Actualización eficiente sin destruir la capa
      heatLayerRef.current.setLatLngs(heatData)
      heatLayerRef.current.setOptions({ radius: dynamicRadius })
    }

    return () => {
      // El cleanup solo ocurre si el componente se desmonta realmente
      if (heatLayerRef.current) {
        // map.removeLayer(heatLayerRef.current) // Comentado para mantener la instancia si es posible
      }
    }
  }, [map, heatData, totalPoints, points.length])

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [map])

  return null
}

// Componente para ajustar la vista a los bounds del GeoJSON
const FitBounds = ({ geoJson }: { geoJson: GeoJsonObject }) => {
  const map = useMap()

  useEffect(() => {
    const layer = L.geoJSON(geoJson)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      const padding = window.innerWidth < 640 ? [16, 16] : [50, 50]
      map.fitBounds(bounds, { padding: padding as [number, number] })
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

const OfficialPointsLayer = () => {
  const { officialPoints, visibleLayers, fetchOfficialPoints, mapFilters } = useBarrioStore()

  useEffect(() => {
    fetchOfficialPoints()
  }, [fetchOfficialPoints])

  const filteredPoints = useMemo(() => {
    if (!officialPoints) return []
    return officialPoints.filter((point) => {
      const props = point.propiedades || {}
      
      // Filtrar por Barrio ID
      if (mapFilters.barrio && point.barrio_id !== mapFilters.barrio) {
        return false
      }

      // Filtrar por Estados de Base (Multi-selección)
      if (mapFilters.estadosBase && mapFilters.estadosBase.length > 0) {
        const estadoBaseStr = (point.estado_base || props.estado_base || '').toLowerCase()
        const isSinBase = estadoBaseStr.includes('sin base')
        const isMala = estadoBaseStr.includes('mala') || estadoBaseStr.includes('deteriorad')
        const isOk = !isSinBase && !isMala && estadoBaseStr !== ''

        // Comprobar si alguno de los filtros seleccionados coincide
        const matchesOk = mapFilters.estadosBase.includes('ok') && isOk
        const matchesMalas = mapFilters.estadosBase.includes('malas') && isMala
        const matchesSinBase = mapFilters.estadosBase.includes('sin_base') && isSinBase

        if (!matchesOk && !matchesMalas && !matchesSinBase) return false
      }

      return true
    })
  }, [officialPoints, mapFilters])

  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'w-8 h-8';
    if (count > 50) size = 'w-10 h-10';
    if (count > 100) size = 'w-12 h-12';

    return L.divIcon({
      html: `
        <div class="flex items-center justify-center ${size} bg-sky-500/20 rounded-full border-2 border-sky-500 shadow-lg backdrop-blur-sm animate-pulse-slow">
          <div class="flex items-center justify-center w-full h-full bg-sky-500 rounded-full text-white text-xs font-black shadow-inner">
            ${count}
          </div>
        </div>
      `,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };
  
  return (
    <>
      {visibleLayers.heatmap && filteredPoints.length > 0 && (
        <HeatmapLayer 
          points={filteredPoints} 
          totalPoints={officialPoints?.length || 0} 
        />
      )}
      
      {visibleLayers.luminarias && filteredPoints.length > 0 && (
        <MarkerClusterGroup
          key={`cluster-group-${filteredPoints.length}-${mapFilters.estadosBase.join(',')}-${mapFilters.barrio}`}
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={40}
          showCoverageOnHover={true}
          spiderfyOnMaxZoom={true}
          zoomToBoundsOnClick={true}
        >
          {filteredPoints.map((point: any, idx: number) => {
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
            
            // Determinar si poner el pin en rojo (mala) o naranja (sin base)
            const estadoBaseStr = (point.estado_base || point.propiedades?.estado_base || '').toLowerCase()
            const isMala = estadoBaseStr.includes('mala') || estadoBaseStr.includes('deteriorad')
            const isSinBase = estadoBaseStr.includes('sin base')
            
            const pinColor = isMala ? '#ef4444' : (isSinBase ? '#f97316' : '#0ea5e9')
            
            return (
              <CircleMarker
                key={`official-${point.id}`}
                center={position}
                radius={6}
                pane="markerPane"
                pathOptions={{
                  fillColor: pinColor,
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
                    <div className="flex items-center gap-1 border-b border-sky-100 pb-1 mb-2">
                      <span className="text-base">💡</span>
                      <div className="text-sm font-black text-sky-600 leading-tight">{name}</div>
                    </div>

                    {/* Campos enriquecidos */}
                    <div className="space-y-1 text-xs text-gray-700">
                      {/* Leer de `propiedades` (JSONB) con fallback en raíz del objeto */}
                      {(() => {
                        const props = point.propiedades || {}
                        const direccion = point.direccion || props.direccion || ''
                        const barrioNombre = point.barrio_nombre || props.barrio || ''
                        const sinLuzRaw = point.sin_luz ?? props.sin_luz
                        const sinLuz = sinLuzRaw === true || sinLuzRaw === 'True' || sinLuzRaw === 'true'

                        const tipo = point.tipo_luminaria || props.tipo || props.tipo_luminaria || props.tipologia || ''
                        const estadoBase = point.estado_base || props.estado_base || ''
                        const cableado = point.cableado || props.cableado || props.alimentacion || props.tipo_de_cableado || ''
                        const medidor = props.medidor || point.medidor || ''

                        return (
                          <>
                            {direccion && (
                              <div className="flex items-start gap-1">
                                <span className="text-gray-400 w-4 shrink-0">📍</span>
                                <span>{direccion}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-1">
                              <span className="text-gray-400 w-4 shrink-0 font-bold text-[10px] mt-0.5">LOC</span>
                              <span className="font-semibold text-gray-700">{barrioNombre || 'Sin barrio'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 w-4 shrink-0 text-orange-400">⚡</span>
                              <span className="text-gray-600 font-medium">
                                {tipo || 'Luminaria'}
                                {cableado && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-600 flex items-center gap-1 inline-flex align-middle">
                                    <span>🔌</span> {cableado}
                                  </span>
                                )}
                              </span>
                            </div>
                            {medidor && (
                              <div className="flex items-start gap-1">
                                <span className="text-gray-400 w-4 shrink-0 text-[10px]">⏲️</span>
                                <span>Medidor: {medidor}</span>
                              </div>
                            )}
                            {estadoBase && (
                              <div className="flex items-start gap-1">
                                <span className="text-gray-400 w-4 shrink-0">🔩</span>
                                <span className={cn(
                                  "font-semibold",
                                  estadoBase.toLowerCase().includes('deteriorada') || estadoBase.toLowerCase().includes('mala') 
                                    ? 'text-red-500' 
                                    : estadoBase.toLowerCase().includes('sin base')
                                      ? 'text-orange-500'
                                      : 'text-green-600'
                                )}>
                                  {estadoBase}
                                </span>
                              </div>
                            )}
                            {sinLuz && (
                              <div className="flex items-center gap-1 bg-red-50 rounded px-1 py-0.5 mt-1">
                                <span className="text-[10px] animate-pulse">🔴</span>
                                <span className="text-red-600 font-bold uppercase text-[10px]">Punto Apagado</span>
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
      )}
    </>
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
  const { activeBaseMap } = useBarrioStore()
  const center = useMemo(() => [-30.7516, -57.9872] as [number, number], [])
  const defaultZoom = typeof window !== 'undefined' && window.innerWidth < 640 ? 15 : 14

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {activeBaseMap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        <FitBounds geoJson={barriosGeoJson} />
        <CenterBarrio selectedBarrio={selectedBarrio || null} geoJson={barriosGeoJson} />

        <BarriosLayer 
          geoJson={barriosGeoJson}
          onBarrioClick={onBarrioClick}
          selectedBarrio={selectedBarrio}
          onEditBarrio={onEditBarrio}
        />

        <OfficialPointsLayer />

        <LayerControl />
        <MobileMapControls />
      </MapContainer>
    </div>
  )
}
