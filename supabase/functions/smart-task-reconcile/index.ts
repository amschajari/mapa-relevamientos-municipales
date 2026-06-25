import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReconcilePayload {
  nombres_validos: string[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  try {
    const payload: ReconcilePayload = await req.json()
    const validos = new Set(payload.nombres_validos.map((n: string) => n.trim()).filter(Boolean))

    if (validos.size === 0) {
      return new Response(JSON.stringify({ error: 'nombres_validos vacío' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let allPoints: any[] = []
    let from = 0
    let batch: any[] | null
    do {
      const { data } = await supabase
        .from('puntos_relevamiento')
        .select('id, nombre')
        .range(from, from + 999)
      batch = data
      if (batch) allPoints = allPoints.concat(batch)
      from += 1000
    } while (batch && batch.length >= 1000)

    if (allPoints.length === 0) {
      return new Response(JSON.stringify({ error: 'Supabase vacío' }), { status: 500 })
    }

    const aEliminar = allPoints.filter((p: any) => !validos.has(p.nombre))
    const idsEliminar = aEliminar.map((p: any) => p.id)
    const enOdooNoEnSupabase = [...validos].filter(n => !allPoints.some((p: any) => p.nombre === n))

    if (idsEliminar.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        eliminados: 0,
        total_supabase: allPoints.length,
        total_odoo: validos.size,
        solo_en_odoo: enOdooNoEnSupabase.length,
      }), { status: 200 })
    }

    const { error, count } = await supabase
      .from('puntos_relevamiento')
      .delete({ count: 'exact' })
      .in('id', idsEliminar)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({
      success: true,
      eliminados: count,
      total_supabase_final: allPoints.length - idsEliminar.length,
      total_odoo: validos.size,
      solo_en_odoo: enOdooNoEnSupabase.slice(0, 10),
    }), { status: 200 })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
