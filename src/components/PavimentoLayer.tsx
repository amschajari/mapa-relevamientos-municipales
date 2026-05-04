import { useEffect, useMemo, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/stores/mapStore'
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
  avenidas: { color: '#004d4d', weight: 4, opacity: 0.9 }
}

const getEsCalleOAv = (nombre: string) => {
  const n = nombre.toLowerCase()
  return n.includes('avenida') || n.includes('av.') || n.startsWith('ruta') || n.includes('ruta ')
}

const PavimentoLayer = () => {
  const { domains } = useMapStore()
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
    return {
      type: 'FeatureCollection' as const,
      features: callesData.map(calle => ({
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
    const nombre = feature?.properties?.nombre || ''
    return getEsCalleOAv(nombre) ? ESTILOS.avenidas : ESTILOS.calle
  }

  const getStyleHover = (feature: any) => {
    const nombre = feature?.properties?.nombre || ''
    const base = getEsCalleOAv(nombre) ? ESTILOS.avenidas : ESTILOS.calle
    return { ...base, weight: base.weight + 2, color: '#006666' }
  }

  if (!capaVisible || !geojsonData) return null

  return (
    <GeoJSON
      data={geojsonData!}
      style={getStyle}
      onEachFeature={(feature, layer) => {
        const props = feature.properties || {}
        const isAvenida = getEsCalleOAv(props.nombre || '')
        const categoria = isAvenida ? 'Avenida' : 'Calle'
        const entre1 = props.entre_calle_1 || ''
        const entre2 = props.entre_calle_2 || ''
        const entre = entre1 && entre2 ? `${entre1} y ${entre2}` : entre1 || entre2 || ''
        const tipoObra = props.tipo_obra || '(Sin tipo de obra)'
        const longM = props.longitud_m || '-'
        const fechaAprob = props.fecha_aprobacion_concejo 
          ? new Date(props.fecha_aprobacion_concejo).toLocaleDateString('es-AR') 
          : '-'
        const fechaInaug = props.fecha_inauguracion 
          ? new Date(props.fecha_inauguracion).toLocaleDateString('es-AR') 
          : '-'
        
        layer.bindTooltip(`
          <div style="font-size:12px;font-weight:600;margin-bottom:4px;">${props.nombre || 'Sin nombre'}</div>
          <div style="font-size:10px;color:#444;margin-bottom:2px;">${categoria} - ${longM} m</div>
          ${entre ? `<div style="font-size:10px;color:#666;margin-bottom:2px;">${entre}</div>` : ''}
          <div style="font-size:10px;color:#004d4d;font-weight:500;margin-bottom:2px;">${tipoObra}</div>
          <div style="font-size:9px;color:#888;margin-top:4px;">Aprob: ${fechaAprob}</div>
          <div style="font-size:9px;color:#888;">Inaug: ${fechaInaug}</div>
        `, { direction: 'top', offset: [0, -5], opacity: 1, sticky: true })

        layer.on('mouseover', (e: any) => {
          e.target.setStyle(getStyleHover(feature))
          e.target.bringToFront()
        })
        layer.on('mouseout', (e: any) => {
          e.target.setStyle(getStyle(feature))
        })
      }}
    />
  )
}

export default PavimentoLayer