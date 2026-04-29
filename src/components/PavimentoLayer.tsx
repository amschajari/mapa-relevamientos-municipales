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
 estado?: string
 tipo_obra?: string
 entre_calle_1?: string
 entre_calle_2?: string
}

const POLLING_INTERVAL = 30000 // 30 segundos

// Estilos simples - Azul petróleo para todas
const ESTILOS = {
  calle: { color: '#004d4d', weight: 2, opacity: 0.9 },
  avenida: { color: '#004d4d', weight: 4, opacity: 0.9 }
}

const PavimentoLayer = () => {
  const { domains } = useMapStore()

  const pavimentoDomain = domains.find(d => d.id === 'pavimento')
  const layerTodas = pavimentoDomain?.layers.find(l => l.id === 'pavimento-todas')

 const capaVisible = layerTodas?.visible ?? false

 const [callesData, setCallesData] = useState<CallePavimentada[]>([])
 const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

 // Cargar datos iniciales (siempre, para tenerlos listos)
 useEffect(() => {
 const fetchCalles = async () => {
 const { data, error } = await supabase
 .from('calles_pavimentadas')
 .select('*')
 .order('nombre')
 .limit(10000)

 if (error) {
 console.error('Error fetching calles:', error)
 return
 }
 setCallesData(data || [])
 setLastUpdate(new Date())
 }
 fetchCalles()
 }, [])

 // Polling: actualizar cada 30 segundos
 useEffect(() => {
 const interval = setInterval(async () => {
 console.log('[PavimentoLayer] Polling Supabase...')
 const { data, error } = await supabase
 .from('calles_pavimentadas')
 .select('*')
 .order('nombre')
 .limit(10000)

 if (error) {
 console.error('Error polling calles:', error)
 return
 }

 setCallesData(data || [])
 setLastUpdate(new Date())
 console.log(`[PavimentoLayer] Actualizado: ${data?.length || 0} segmentos`)
 }, POLLING_INTERVAL)

 return () => clearInterval(interval)
 }, [])

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
 longitud_m: calle.longitud_m,
 estado: calle.estado || 'pendiente',
 tipo_obra: calle.tipo_obra,
 entre_calle_1: calle.entre_calle_1,
 entre_calle_2: calle.entre_calle_2
 },
 geometry: geom
 }
 })
 }
 }, [callesData])

 const getStyle = (feature: any) => {
    const nombre = feature?.properties?.nombre || ''
    const estado = feature?.properties?.estado || 'pendiente'
    
    // Solo mostrar calles CONSERVADAS
    if (estado !== 'conservado') {
      return { color: '#000', weight: 0, opacity: 0 }
    }
    
    // Determinar si es avenida por el nombre
    const nombreLower = nombre.toLowerCase()
    const isAvenida = nombreLower.includes('avenida') ||
      nombreLower.includes('av.') ||
      nombreLower.startsWith('ruta') ||
      nombreLower.includes('ruta ')
    
    // Todas azul petróleo, avenidas más gruesas
    return isAvenida ? ESTILOS.avenida : ESTILOS.calle
  }

 // No renderizar si no hay datos o la capa no está visible
 if (!capaVisible || !geojsonData) return null

 return (
    <GeoJSON
      data={geojsonData!}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const props = feature.properties || {}
        const isAvenida = (props.nombre || '').toLowerCase().includes('avenida')
        const categoria = isAvenida ? 'Avenida' : 'Calle'
        
        // Tooltip simple
        layer.bindTooltip(`
          <div style="font-size:11px;font-weight:600;white-space:nowrap;">${props.nombre || 'Sin nombre'}</div>
          <div style="font-size:9px;color:#666;white-space:nowrap;">${categoria}</div>
        `, {
          direction: 'top',
          offset: [0, -3],
          opacity: 1,
          sticky: true
        })
      }}
    />
  )
}

export default PavimentoLayer