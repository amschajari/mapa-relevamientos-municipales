import { useEffect, useMemo, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/mapStore'
import { supabase } from '@/lib/supabase'

interface CallePavimentada {
  id: string
  fid: number
  nombre: string
  geom: any
  longitud_m?: number
}

const PavimentoLayer = () => {
  const { domains } = useMapStore()
  
  const pavimentoDomain = domains.find(d => d.id === 'pavimento')
  const layerCalles = pavimentoDomain?.layers.find(l => l.id === 'pavimento-calles')
  const layerAvenidas = pavimentoDomain?.layers.find(l => l.id === 'pavimento-avenidas')

  const callesVisible = layerCalles?.visible ?? false
  const avenidasVisible = layerAvenidas?.visible ?? false

  // Solo renderizar si alguna capa estávisible
  const showLayer = callesVisible || avenidasVisible

  const [callesData, setCallesData] = useState<CallePavimentada[]>([])

  useEffect(() => {
    if (!callesData.length || showLayer) {
      const fetchCalles = async () => {
        const { data, error } = await supabase
          .from('calles_pavimentadas')
          .select('*')
          .order('nombre')
        
        if (error) {
          console.error('Error fetching calles:', error)
          return
        }
        setCallesData(data || [])
      }
      fetchCalles()
    }
  }, [showLayer, callesData.length])

  const geojsonData = useMemo(() => {
    if (!callesData.length) return null

    return {
      type: 'FeatureCollection' as const,
      features: callesData.map(calle => {
        // Limpiar crs de geometría
        const geom = calle.geom?.crs ? { ...calle.geom, crs: undefined } : calle.geom
        
        return {
          type: 'Feature' as const,
          properties: {
            fid: calle.fid,
            nombre: calle.nombre,
            longitud_m: calle.longitud_m
          },
          geometry: geom
        }
      })
    }
  }, [callesData])

const getStyle = (feature: any) => {
    const nombre = feature?.properties?.nombre || ''
    const nombreLower = nombre.toLowerCase()
    const isAvenida = nombreLower.includes('avenida') || 
                    nombreLower.includes('av.') ||
                    nombreLower.startsWith('ruta') ||
                    nombreLower.includes('ruta ')
    
    if (isAvenida && avenidasVisible) {
      return {
        color: '#374151',
        weight: 4,
        opacity: 1
      }
    }

    if (callesVisible) {
      return {
        color: '#6b7280',
        weight: 3,
        opacity: 1
      }
    }

    return { color: '#6b7280', weight: 3, opacity: 0 }
  }

  if (!showLayer || (!callesVisible && !avenidasVisible)) return null

  return (
    <GeoJSON
      data={geojsonData!}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const props = feature.properties || {}
        layer.bindPopup(`
          <div class="p-2 min-w-[150px]">
            <div class="font-bold text-gray-800 text-sm">${props.nombre || 'Sin nombre'}</div>
            <div class="text-xs text-gray-500 mt-1">
              ${props.longitud_m ? props.longitud_m + ' m' : ''}
            </div>
          </div>
        `)
      }}
    />
  )
}

export default PavimentoLayer