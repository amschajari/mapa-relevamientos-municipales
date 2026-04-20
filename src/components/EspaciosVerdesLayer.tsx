import { useEffect, useRef, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/stores'

interface EspacioVerde {
  id: string
  fid: number
  nombre: string | null
  geom: any
}

export const EspaciosVerdesLayer = () => {
  const map = useMap()
  const layerRef = useRef<L.GeoJSON | null>(null)
  
  const { espaciosVerdes, layers } = useMapStore()
  
  // Verificar si la capa está visible
  const layerVisible = useMemo(() => {
    const layer = layers.find(l => l.id === 'espacios-verdes-todos')
    return layer?.visible ?? false
  }, [layers])

  // Crear estilo para espacios verdes
  const style = useMemo(() => ({
    color: '#16a34a',
    weight: 2,
    fillColor: '#22c55e',
    fillOpacity: 0.4
  }), [])

  useEffect(() => {
    if (!espaciosVerdes || espaciosVerdes.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    if (!layerVisible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    // Convertir datos de Supabase a GeoJSON
    const geojsonFeatures = espaciosVerdes
      .filter((e: EspacioVerde) => e.geom)
      .map((e: EspacioVerde) => ({
        type: 'Feature' as const,
        properties: {
          id: e.id,
          fid: e.fid,
          nombre: e.nombre
        },
        geometry: e.geom
      }))

    const geojson = {
      type: 'FeatureCollection' as const,
      features: geojsonFeatures
    }

    // Crear o actualizar capa
    if (!layerRef.current) {
      layerRef.current = L.geoJSON(geojson, {
        style,
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {}
          const nombre = props.nombre || `Espacio ${props.fid}`
          layer.bindTooltip(nombre, {
            permanent: false,
            direction: 'center',
            className: 'bg-white px-2 py-1 rounded shadow text-sm'
          })
        }
      }).addTo(map)
    } else {
      layerRef.current.clearLayers()
      layerRef.current.addData(geojson)
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [espaciosVerdes, layerVisible, map, style])

  return null
}