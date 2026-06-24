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
  return parseFloat(str.replace(/[^0-9.\-]/g, '').replace(',', '.'))
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
  'malo': 'Sin base',
}

const normalizarEstadoBase = (val: string): string =>
  NORMALIZAR_ESTADO_BASE[val.trim().toLowerCase()] || val

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
    if (payload.tipo_luminaria) propiedades.tipo = payload.tipo_luminaria
    if (payload.sin_luz !== undefined) propiedades.sin_luz = normalizarSinLuz(payload.sin_luz)
    if (payload.tipo_cableado) propiedades.cableado = payload.tipo_cableado
    if (payload.estado_base) propiedades.estado_base = normalizarEstadoBase(payload.estado_base)
    if (payload.tipologia) propiedades.tipologia = payload.tipologia
    if (payload.direccion) propiedades.direccion = payload.direccion
    if (payload.observacion) propiedades.observacion = payload.observacion
    if (medidorVal) propiedades.medidor = medidorVal
    if (barrioNombre) propiedades.barrio_odoo = barrioNombre
    if (payload.agente) propiedades.agente_odoo = payload.agente
    if (payload.fecha) propiedades.fecha_odoo = payload.fecha

    const { error } = await supabase
      .from('puntos_relevamiento')
      .upsert({
        nombre: nombreLuminaria,
        barrio_id,
        geom: `POINT(${lng} ${lat})`,
        propiedades,
        tipo_luminaria: payload.tipo_luminaria || null,
        cableado: payload.tipo_cableado || null,
        sin_luz: payload.sin_luz !== undefined ? normalizarSinLuz(payload.sin_luz) : false,
        estado_base: payload.estado_base ? normalizarEstadoBase(payload.estado_base) : null,
        direccion: payload.direccion || null,
        barrio_nombre: barrioNombre || null,
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
      JSON.stringify({ success: true, nombre: nombreLuminaria }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
