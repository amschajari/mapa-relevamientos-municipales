import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface LuminariaRow {
  nombre: string
  latitud: string
  longitud: string
  barrio: string
  tipo_luminaria?: string
  sin_luz?: string
  tipo_cableado?: string
  estado_base?: string
  direccion?: string
  medidor?: string
}

interface ReconcilePayload {
  puntos: LuminariaRow[]
}

const limpiarCoordenada = (val: string): number | null => {
  if (!val) return null
  return parseFloat(val.replace(/[^0-9.-]/g, '').replace(',', '.'))
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

const normalizarSinLuz = (val: string): boolean =>
  val === 'true' || val === 'True' || val === 'TRUE' || val === '1' || val === 'Sí' || val === 'Si' || val === 'si'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  try {
    const payload: ReconcilePayload = await req.json()
    const rows = payload.puntos || []

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'puntos vacío' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const nombresValidos = new Set(rows.map(r => r.nombre.trim()).filter(Boolean))

    // 1. Obtener todos los barrios para resolver barrio_id
    const { data: barrios } = await supabase.from('barrios').select('id, nombre')
    const barrioMap = new Map<string, string>()
    if (barrios) {
      for (const b of barrios) {
        barrioMap.set(normalizarNombre(b.nombre), b.id)
      }
    }

    // 2. Obtener todos los puntos actuales de Supabase
    let puntosSupabase: any[] = []
    let from = 0
    let batch: any[] | null
    do {
      const { data } = await supabase
        .from('puntos_relevamiento')
        .select('id, nombre')
        .range(from, from + 999)
      batch = data
      if (batch) puntosSupabase = puntosSupabase.concat(batch)
      from += 1000
    } while (batch && batch.length >= 1000)

    const nombresSupabase = new Set(puntosSupabase.map((p: any) => p.nombre))

    // 3. Puntos a ELIMINAR (en Supabase pero no en Odoo)
    const idsEliminar = puntosSupabase
      .filter((p: any) => !nombresValidos.has(p.nombre))
      .map((p: any) => p.id)

    // 4. Puntos a INSERTAR (en Odoo pero no en Supabase)
    const aInsertar = rows.filter(r => !nombresSupabase.has(r.nombre))

    let eliminados = 0
    let insertados = 0
    const errores: string[] = []

    // 5. Ejecutar DELETE de huérfanos
    if (idsEliminar.length > 0) {
      const { error, count } = await supabase
        .from('puntos_relevamiento')
        .delete({ count: 'exact' })
        .in('id', idsEliminar)
      if (!error) eliminados = count || idsEliminar.length
    }

    // 6. Ejecutar INSERT de faltantes
    const insertBatch: any[] = []
    for (const row of aInsertar) {
      const lat = limpiarCoordenada(row.latitud)
      const lng = limpiarCoordenada(row.longitud)
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        errores.push(`${row.nombre}: coordenadas inválidas`)
        continue
      }

      const barrioNorm = normalizarNombre(row.barrio || '')
      const barrio_id = barrioMap.get(barrioNorm) || null
      if (!barrio_id) {
        errores.push(`${row.nombre}: barrio "${row.barrio}" no encontrado`)
        continue
      }

      const propiedades: Record<string, string> = {}
      if (row.tipo_luminaria) propiedades.tipo = row.tipo_luminaria
      if (row.estado_base) propiedades.estado_base = normalizarEstadoBase(row.estado_base)
      if (row.sin_luz) propiedades.sin_luz = normalizarSinLuz(row.sin_luz) ? 'True' : ''
      if (row.tipo_cableado) propiedades.cableado = row.tipo_cableado
      if (row.direccion) propiedades.direccion = row.direccion
      if (row.medidor) propiedades.medidor = row.medidor
      propiedades.barrio_odoo = row.barrio || ''

      insertBatch.push({
        nombre: row.nombre,
        barrio_id,
        geom: `POINT(${lng} ${lat})`,
        propiedades,
        tipo_luminaria: row.tipo_luminaria || null,
        cableado: row.tipo_cableado || null,
        sin_luz: normalizarSinLuz(row.sin_luz || ''),
        estado_base: row.estado_base ? normalizarEstadoBase(row.estado_base) : null,
        direccion: row.direccion || null,
        barrio_nombre: row.barrio || null,
      })
    }

    // Insertar en lotes de 100
    for (let i = 0; i < insertBatch.length; i += 100) {
      const batch = insertBatch.slice(i, i + 100)
      const { error } = await supabase.from('puntos_relevamiento').upsert(batch, {
        onConflict: 'nombre',
        ignoreDuplicates: false,
      })
      if (error) {
        errores.push(`lote ${i / 100}: ${error.message}`)
      } else {
        insertados += batch.length
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_supabase_antes: puntosSupabase.length,
      total_odoo: rows.length,
      eliminados,
      insertados,
      total_supabase_despues: puntosSupabase.length - eliminados + insertados,
      errores: errores.slice(0, 20),
    }), { status: 200 })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
