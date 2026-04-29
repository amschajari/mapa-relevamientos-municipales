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

// Estilos por categoría
const ESTILOS_POR_TIPO = {
  // Hormigón - Azul petróleo (más suave)
  hormigon_calle: { color: '#006666', weight: 2, opacity: 1 },
  hormigon_avenida: { color: '#006666', weight: 4, opacity: 1 },
  // Asfalto - Rojo bermellón (más suave)
  asfalto_calle: { color: '#b30000', weight: 2, opacity: 1 },
  asfalto_avenida: { color: '#b30000', weight: 4, opacity: 1 },
  // Otros - Gris
  otros_calle: { color: '#6b7280', weight: 2, opacity: 1 },
  otros_avenida: { color: '#6b7280', weight: 4, opacity: 1 },
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
   const tipoObra = feature?.properties?.tipo_obra || ''
 
   // Solo mostrar calles CONSERVADAS (pavimentadas reales)
   if (estado !== 'conservado') {
     return { color: '#000', weight: 0, opacity: 0 } // Invisible
   }
 
   // Determinar si es avenida
   const nombreLower = nombre.toLowerCase()
   const isAvenida = nombreLower.includes('avenida') ||
     nombreLower.includes('av.') ||
     nombreLower.startsWith('ruta') ||
     nombreLower.includes('ruta ')
 
   // Determinar tipo de obra
   const tipoLower = tipoObra.toLowerCase()
   const esHormigon = tipoLower.includes('hormigon') || tipoLower.includes('hormigón')
   const esAsfalto = tipoLower.includes('asfaltico') || tipoLower.includes('asfáltico')
 
   // Construir clave de estilo
   let clave = 'otros'
   if (esHormigon) clave = 'hormigon'
   else if (esAsfalto) clave = 'asfalto'
 
   clave += isAvenida ? '_avenida' : '_calle'
 
 return ESTILOS_POR_TIPO[clave as keyof typeof ESTILOS_POR_TIPO] || ESTILOS_POR_TIPO.otros_calle
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
        const tipoLabel = props.tipo_obra || 'Pavimento'
        const categoria = isAvenida ? 'Avenida' : 'Calle'
        
        // Tooltip simple sin bordes
        layer.bindTooltip(`
          <div style="font-size:12px;font-weight:600;white-space:nowrap;">${props.nombre || 'Sin nombre'}</div>
          <div style="font-size:10px;color:#666;white-space:nowrap;">${categoria} · ${tipoLabel}</div>
        `, {
          direction: 'top',
          offset: [0, -3],
          opacity: 1,
          className: 'custom-tooltip'
        })
      }}
    />
  )
}

export default PavimentoLayer