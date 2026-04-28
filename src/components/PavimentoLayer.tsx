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
 const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

 // Cargar datos iniciales
 useEffect(() => {
 if (!callesData.length || showLayer) {
 const fetchCalles = async () => {
 const { data, error } = await supabase
 .from('calles_pavimentadas')
 .select('*')
 .order('nombre')
 .limit(10000) // Traer todos, no solo 1000

 if (error) {
 console.error('Error fetching calles:', error)
 return
 }
 setCallesData(data || [])
 setLastUpdate(new Date())
 }
 fetchCalles()
 }
 }, [showLayer, callesData.length])

 // Polling: actualizar cada 30 segundos
 useEffect(() => {
 if (!showLayer) return

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
 }, [showLayer])

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
 const nombreLower = nombre.toLowerCase()
 const isAvenida = nombreLower.includes('avenida') ||
 nombreLower.includes('av.') ||
 nombreLower.startsWith('ruta') ||
 nombreLower.includes('ruta ')

 // Calles descartadas no se muestran
 if (estado === 'descartado') {
 return { color: '#6b7280', weight: 0, opacity: 0 }
 }

 // Pendientes: línea punteada gris
 if (estado === 'pendiente') {
 return {
 color: '#9ca3af',
 weight: 2,
 opacity: 0.5,
 dashArray: '5, 5'
 }
 }

 // Conservadas: estilo normal
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
 const estadoColor = props.estado === 'conservado' ? '#16a34a' : 
 props.estado === 'descartado' ? '#dc2626' : '#f59e0b'
 const estadoLabel = props.estado === 'conservado' ? 'Conservado' : 
 props.estado === 'descartado' ? 'Descartado' : 'Pendiente'
 
 layer.bindPopup(`
 <div class="p-2 min-w-[180px]">
 <div class="font-bold text-gray-800 text-sm">${props.nombre || 'Sin nombre'}</div>
 <div class="text-xs mt-1" style="color:${estadoColor};font-weight:600;">
 ● ${estadoLabel}
 </div>
 ${props.tipo_obra ? `<div class="text-xs text-gray-500 mt-1">Tipo: ${props.tipo_obra}</div>` : ''}
 ${props.entre_calle_1 ? `<div class="text-xs text-gray-500">Entre: ${props.entre_calle_1}${props.entre_calle_2 ? ' y ' + props.entre_calle_2 : ''}</div>` : ''}
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