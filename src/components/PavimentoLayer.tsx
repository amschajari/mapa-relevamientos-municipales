import { useEffect, useMemo, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/mapStore'
import { useBarrioStore } from '@/stores/barrioStore'
import { supabase } from '@/lib/supabase'

interface CallePavimentada {
  id: string
  fid: number
  nombre: string
  calle?: string
  geom: any
  longitud_m?: number
  estado?: string
  tipo_obra?: string
  entre_calle_1?: string
  entre_calle_2?: string
  fecha_aprobacion_concejo?: string
  fecha_inauguracion?: string
  observaciones?: string
}

const POLLING_INTERVAL = 30000

const ESTILOS = {
    calle: { color: '#004d4d', weight: 2, opacity: 0.9 },
    calleHover: { color: '#006666', weight: 4, opacity: 1 },
    avenidas: { color: '#004d4d', weight: 4, opacity: 0.9 },
    conservado: { color: '#0ea5e9', weight: 2.5, opacity: 0.9 },
    pendiente: { color: '#eab308', weight: 2, opacity: 0.7 },
    descartado: { color: '#ef4444', weight: 1.5, opacity: 0.5 }
  }

const getEsCalleOAv = (nombre: string) => {
  const n = nombre.toLowerCase()
  return n.includes('avenida') || n.includes('av.') || n.startsWith('ruta') || n.includes('ruta ')
}

const PavimentoLayer = () => {
    const { domains } = useMapStore()
    const { mapFilters } = useBarrioStore()
    const pavimentoDomain = domains.find(d => d.id === 'pavimento')
    const layerTodas = pavimentoDomain?.layers.find(l => l.id === 'pavimento-todas')
    const capaVisible = layerTodas?.visible ?? false
    const [callesData, setCallesData] = useState<CallePavimentada[]>([])

  useEffect(() => {
    const fetchCalles = async () => {
      const { data, error } = await supabase
        .from('calles_pavimentadas')
        .select('*')
        .order('nombre')
        .limit(10000)
      if (error) {
        console.error('Error fetching:', error)
        return
      }
      setCallesData(data || [])
    }
    fetchCalles()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('[PavimentoLayer] Polling...')
      const { data } = await supabase
        .from('calles_pavimentadas')
        .select('*')
        .order('nombre')
        .limit(10000)
      if (data) setCallesData(data)
    }, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [])

const geojsonData = useMemo(() => {
      if (!callesData.length) return null

      // Aplicar filtros
      let filtered = callesData
      if (!mapFilters.pavimentoMostrarDescartadas) {
        filtered = filtered.filter(c => c.estado !== 'descartado')
      }
      if (mapFilters.pavimentoSoloConDatos) {
        filtered = filtered.filter(c => c.observaciones && c.observaciones.trim() !== '')
      }

      return {
        type: 'FeatureCollection' as const,
        features: filtered.map(calle => ({
        type: 'Feature' as const,
        properties: {
          fid: calle.fid,
          nombre: calle.nombre,
          longitud_m: calle.longitud_m,
          estado: calle.estado || 'pendiente',
          tipo_obra: calle.tipo_obra,
          entre_calle_1: calle.entre_calle_1,
          entre_calle_2: calle.entre_calle_2,
          fecha_aprobacion_concejo: calle.fecha_aprobacion_concejo,
          fecha_inauguracion: calle.fecha_inauguracion
        },
        geometry: calle.geom?.crs ? { ...calle.geom, crs: undefined } : calle.geom
      }))
    }
  }, [callesData])

const getStyle = (feature: any) => {
      const props = feature?.properties || {}
      const estado = props.estado || 'pendiente'
      if (estado === 'descartado') return ESTILOS.descartado
      if (estado === 'conservado') return ESTILOS.conservado
      const nombre = props.nombre || ''
      return getEsCalleOAv(nombre) ? ESTILOS.avenidas : ESTILOS.pendiente
    }

const getStyleHover = (feature: any) => {
      const props = feature?.properties || {}
      const estado = props.estado || 'pendiente'
      const base = estado === 'descartado' ? ESTILOS.descartado
        : estado === 'conservado' ? ESTILOS.conservado
        : ESTILOS.pendiente
      return { ...base, weight: base.weight + 2, color: '#006666' }
    }

  if (!capaVisible || !geojsonData) return null

return (
      <GeoJSON
        data={geojsonData!}
        style={getStyle}
        onEachFeature={(_feature, layer) => {

          layer.on('mouseover', (e: any) => {
            e.target.setStyle(getStyleHover(_feature))
            e.target.bringToFront()
          })
          layer.on('mouseout', (e: any) => {
            e.target.setStyle(getStyle(_feature))
          })
        }}
      />
  )
}

export default PavimentoLayer