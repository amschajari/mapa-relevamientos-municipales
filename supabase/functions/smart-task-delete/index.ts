import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeletePayload {
  _id?: number
  id?: number
  nombre?: string
  name?: string
  display_name?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const payload: DeletePayload = await req.json()

    const nombreLuminaria = payload.nombre || payload.name || payload.display_name
    const odooId = payload.id !== undefined && payload.id !== null
      ? Number(payload.id)
      : (payload._id !== undefined && payload._id !== null ? Number(payload._id) : null)

    if (!nombreLuminaria && odooId === null) {
      return new Response(
        JSON.stringify({ error: 'No se pudo determinar id ni nombre a eliminar', payload }),
        { status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Intentar borrar por odoo_id (identidad estable de Odoo)
    if (odooId !== null && !isNaN(odooId)) {
      const { error, count } = await supabase
        .from('puntos_relevamiento')
        .delete({ count: 'exact' })
        .eq('odoo_id', odooId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        )
      }

      if (count && count > 0) {
        return new Response(
          JSON.stringify({ success: true, op: 'delete-odoo', deleted: count }),
          { status: 200 }
        )
      }
    }

    // 2. Fallback: borrar por nombre exacto (registros sin odoo_id adoptado aún)
    if (nombreLuminaria) {
      const { error, count } = await supabase
        .from('puntos_relevamiento')
        .delete({ count: 'exact' })
        .eq('nombre', nombreLuminaria)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        )
      }

      return new Response(
        JSON.stringify({ success: true, op: 'delete-nombre', nombre: nombreLuminaria, deleted: count }),
        { status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, op: 'nada', deleted: 0 }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
