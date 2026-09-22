import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface LuminariaPayload {
  id?: number
  nombre?: string
  name?: string // Odoo native
  latitud?: any
  longitud?: any
  barrio?: any // can be string, [id, name] array, or object
  tipo_luminaria?: string
  sin_luz?: boolean
  tipo_cableado?: string
  estado_base?: string
  tipologia?: string
  direccion?: string
  observacion?: string
  medidor_id?: any // can be number, string, [id, name], or object
  fecha_compra_foco?: string
  vencimiento_garantia_foco?: string
  fecha_mantenimiento?: string
  observacion_mantenimiento?: string
  numero_recambios?: string
  agente?: string
  fecha?: string
}

const limpiarCoordenada = (val: any): number | null => {
  if (val === undefined || val === null) return null
  const str = String(val).trim()
  if (!str) return null
  return parseFloat(str.replace(/[^0-9.-]/g, '').replace(',', '.'))
}

const normalizarNombre = (str: string): string =>
  str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

const NORMALIZAR_ESTADO_BASE: Record<string, string> = {
  'buena': 'Con base en buenas condiciones',
  'bueno': 'Con base en buenas condiciones',
  'mala': 'Con base en malas condiciones',
  'malas condiciones': 'Con base en malas condiciones',
  'sin base': 'Sin base',
  'sin_base': 'Sin base',
  'malo': 'Sin base',
  'con base en buenas condiciones': 'Con base en buenas condiciones',
  'con base en malas condiciones': 'Con base en malas condiciones',
}

const normalizarEstadoBase = (val: string): string =>
  NORMALIZAR_ESTADO_BASE[normalizarClave(val)] || normalizarValor(val)

const VALORES_CANONICOS: Record<string, string> = {
  'sin base': 'Sin base',
  'aereo': 'Aéreo',
  'aéreo': 'Aéreo',
  'subterraneo': 'Subterráneo',
  'subterráneo': 'Subterráneo',
  'led': 'LED',
  'sodio': 'Sodio',
  'otro': 'Otro',
  'no se puede identificar': 'No se puede identificar',
}

const normalizarClave = (val: string): string =>
  val.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizarValor = (val?: string): string => {
  if (!val) return val ?? ''
  const v = val.trim()
  if (!v) return ''
  const clave = normalizarClave(v)
  if (VALORES_CANONICOS[clave]) return VALORES_CANONICOS[clave]
  if (NORMALIZAR_ESTADO_BASE[clave]) return NORMALIZAR_ESTADO_BASE[clave]
  // Tipo luminaria: capitalizar palabras y mantener vatios/acrónimos en mayúscula
  return v
    .split(/\s+/)
    .map(p => {
      const conVatios = p.match(/^(\d+)\s*w$/i)
      if (conVatios) return `${conVatios[1]}W`
      if (p.toLowerCase() === 'led') return 'LED'
      const baja = p.toLowerCase()
      return baja.charAt(0).toUpperCase() + baja.slice(1)
    })
    .join(' ')
}

const normalizarSinLuz = (val: any): boolean =>
  val === true || val === 'true' || val === 'True' || val === 1 || val === '1'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const payload: LuminariaPayload = await req.json()

    // 1. Obtener nombre/identificador (soportando nombre, name y display_name)
    const nombreLuminaria = payload.nombre || payload.name || (payload as any).display_name || (payload.id ? `Luminaria-${payload.id}` : '')
    if (!nombreLuminaria) {
      return new Response(
        JSON.stringify({ error: 'Identificador (nombre, name o display_name) no proporcionado', payload }),
        { status: 400 }
      )
    }

    // 2. Limpiar coordenadas de forma segura
    const lat = limpiarCoordenada(payload.latitud)
    const lng = limpiarCoordenada(payload.longitud)

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return new Response(
        JSON.stringify({ error: 'Coordenadas inválidas (latitud/longitud)', payload }),
        { status: 400 }
      )
    }

    // 3. Extraer el nombre del barrio de manera robusta
    let barrioNombre = ''
    if (payload.barrio) {
      if (Array.isArray(payload.barrio)) {
        barrioNombre = String(payload.barrio[1] || '')
      } else if (typeof payload.barrio === 'object') {
        barrioNombre = String(payload.barrio.display_name || payload.barrio.name || '')
      } else {
        barrioNombre = String(payload.barrio)
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let barrio_id: string | null = null
    if (barrioNombre) {
      const barrioNormalizado = normalizarNombre(barrioNombre)
      const { data: barrios } = await supabase
        .from('barrios')
        .select('id, nombre')
        .limit(100)

      if (barrios) {
        const found = barrios.find(
          (b: any) => normalizarNombre(b.nombre) === barrioNormalizado
        )
        if (found) barrio_id = found.id
      }
    }

    if (!barrio_id) {
      return new Response(
        JSON.stringify({ error: `Barrio "${barrioNombre || 'no especificado'}" no encontrado en Supabase` }),
        { status: 400 }
      )
    }

    // 4. Extraer medidor_id de forma robusta
    let medidorVal = ''
    if (payload.medidor_id !== undefined && payload.medidor_id !== null) {
      if (Array.isArray(payload.medidor_id)) {
        medidorVal = String(payload.medidor_id[0] || '')
      } else if (typeof payload.medidor_id === 'object') {
        medidorVal = String(payload.medidor_id.id || '')
      } else {
        medidorVal = String(payload.medidor_id)
      }
    }

    const propiedades: Record<string, any> = {}
    if (payload.tipo_luminaria) propiedades.tipo = normalizarValor(payload.tipo_luminaria)
    if (payload.sin_luz !== undefined) propiedades.sin_luz = normalizarSinLuz(payload.sin_luz)
    if (payload.tipo_cableado) propiedades.cableado = normalizarValor(payload.tipo_cableado)
    if (payload.estado_base) propiedades.estado_base = normalizarEstadoBase(payload.estado_base)
    if (payload.tipologia) propiedades.tipologia = payload.tipologia
    if (payload.direccion) propiedades.direccion = payload.direccion
    if (payload.observacion) propiedades.observacion = payload.observacion
    if (medidorVal) propiedades.medidor = medidorVal
    if (barrioNombre) propiedades.barrio_odoo = barrioNombre
    if (payload.agente) propiedades.agente_odoo = payload.agente
    if (payload.fecha) propiedades.fecha_odoo = payload.fecha

    const fila = {
      barrio_id,
      geom: `POINT(${lng} ${lat})`,
      propiedades,
      tipo_luminaria: normalizarValor(payload.tipo_luminaria) || null,
      cableado: normalizarValor(payload.tipo_cableado) || null,
      sin_luz: payload.sin_luz !== undefined ? normalizarSinLuz(payload.sin_luz) : false,
      estado_base: payload.estado_base ? normalizarEstadoBase(payload.estado_base) : null,
      direccion: payload.direccion || null,
      barrio_nombre: barrioNombre || null,
    }

    const odooId = payload.id !== undefined && payload.id !== null ? Number(payload.id) : null

    // Estrategia de upsert priorizando odoo_id (identidad estable).
    // - Si llega odoo_id: buscar por odoo_id → update (un rename actualiza la misma fila).
    // - Si no existe por odoo_id pero hay EXACTAMENTE UNA fila con ese nombre y odoo_id NULL
    //   → update + asignar odoo_id (migración gradual de datos existentes).
    // - Si hay 0 o >1 filas con ese nombre sin odoo_id → INSERT (no tocar ambigüedad).
    // - Si NO llega odoo_id → fallback al comportamiento histórico (upsert por nombre).
    if (odooId !== null && !isNaN(odooId)) {
      const { data: porOdooId } = await supabase
        .from('puntos_relevamiento')
        .select('id')
        .eq('odoo_id', odooId)
        .limit(1)

      if (porOdooId && porOdooId.length > 0) {
        const { error } = await supabase
          .from('puntos_relevamiento')
          .update({ nombre: nombreLuminaria, ...fila })
          .eq('id', porOdooId[0].id)

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }
        return new Response(
          JSON.stringify({ success: true, op: 'update-odoo', nombre: nombreLuminaria }),
          { status: 200 }
        )
      }

      const { data: candidatosNombre } = await supabase
        .from('puntos_relevamiento')
        .select('id')
        .eq('nombre', nombreLuminaria)
        .is('odoo_id', null)

      if (candidatosNombre && candidatosNombre.length === 1) {
        const { error } = await supabase
          .from('puntos_relevamiento')
          .update({ odoo_id: odooId, ...fila })
          .eq('id', candidatosNombre[0].id)

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }
        return new Response(
          JSON.stringify({ success: true, op: 'update-nombre-adoptar-odoo', nombre: nombreLuminaria }),
          { status: 200 }
        )
      }

      const { error } = await supabase
        .from('puntos_relevamiento')
        .insert({ nombre: nombreLuminaria, odoo_id: odooId, ...fila })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
      return new Response(
        JSON.stringify({ success: true, op: 'insert-odoo', nombre: nombreLuminaria }),
        { status: 200 }
      )
    }

    const { error } = await supabase
      .from('puntos_relevamiento')
      .upsert({
        nombre: nombreLuminaria,
        ...fila,
      }, {
        onConflict: 'nombre',
        ignoreDuplicates: false,
      })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, op: 'upsert-nombre', nombre: nombreLuminaria }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
