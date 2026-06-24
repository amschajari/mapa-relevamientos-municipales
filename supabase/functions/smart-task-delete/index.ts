import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeletePayload {
  _id?: number
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

    if (!nombreLuminaria) {
      return new Response(
        JSON.stringify({ error: 'No se pudo determinar el nombre a eliminar', payload }),
        { status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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
      JSON.stringify({ success: true, nombre: nombreLuminaria, deleted: count }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
