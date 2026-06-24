# Guía de Integración: Odoo 19 ↔ Supabase GIS — Tiempo Real

> **Estado**: ✅ Completa — Create, Update y Delete funcionando en producción (24/06/2026)
> **Autor**: Equipo GIS — Municipalidad de Chajarí

---

## Arquitectura del Sistema

Cuando un usuario crea, edita o elimina una luminaria en Odoo, el cambio se refleja automáticamente en el mapa web GIS en tiempo real, sin recargar la página.

```
Odoo Municipal (geo.chajari.gob.ar)
       │
       ├── "Al crear y editar" ── POST HTTPS ──▶ smart-task (Edge Function)
       │                                               │
       │                                          UPSERT en
       │                                     puntos_relevamiento
       │                                               │
       ├── "Al eliminar" ─── POST HTTPS ──▶ smart-task-delete (Edge Function)
       │                                               │
       │                                          DELETE en
       │                                     puntos_relevamiento
       │                                               │
       └── Datos maestros ─── CSV import ──▶ importador manual
                                                  │
                                          (flujo alternativo)
                                                      
                                              Supabase Realtime
                                              (WebSocket)
                                                    │
                                                    ▼
                                          Mapa GIS React
                                    (amschajari.github.io)
```

---

## Componente 1: Odoo — Reglas de Automatización

No requiere código Python ni módulos nuevos. Usa la funcionalidad nativa de Odoo: `base_automation`.

### Regla 1: Crear y Editar (INSERT / UPDATE)

**Configuración:**
- Ir a: `Ajustes → Técnico → Automatización → Reglas de automatización`
- Crear nueva regla:

| Campo | Valor |
|---|---|
| **Nombre** | `Sync luminarias → GIS` |
| **Modelo** | `gob_chajari_gestion_iluminacion.luminaria` |
| **Activar** | `Al crear y editar` |
| **Antes de actualizar el dominio?** | `Coincidir todos los registros` |
| **Aplicar en?** | `Coincidir todos los registros` |
| **Al actualizar?** | `Sin campos seleccionados` |

**Acción — Enviar notificación webhook:**
| Campo | Valor |
|---|---|
| **URL** | `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task` |
| **Campos** | `display_name`, `latitud`, `longitud`, `barrio`, `tipo_luminaria`, `direccion`, `sin_luz`, `tipo_cableado`, `estado_base`, `medidor_id` |

> **Importante**: El campo "Campos" debe tener al menos los campos listados. Si está vacío, Odoo envía solo metadatos sin los datos de la luminaria.

### Regla 2: Eliminar (DELETE)

Crear una segunda regla separada:

| Campo | Valor |
|---|---|
| **Nombre** | `Sync luminarias → GIS (DELETE)` |
| **Modelo** | `gob_chajari_gestion_iluminacion.luminaria` |
| **Activar** | `Al eliminar` |
| **Antes de actualizar el dominio?** | `Coincidir todos los registros` |
| **Aplicar en?** | `Coincidir todos los registros` |

**Acción — Enviar notificación webhook:**
| Campo | Valor |
|---|---|
| **URL** | `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task-delete` |
| **Campos** | `display_name` |

> **Nota**: La regla "Al eliminar" se dispara antes de que Odoo borre el registro, por lo que `display_name` sigue disponible en el payload.

### Payload que Odoo envía

Al crear/editar:
```json
{
  "_action": "Sync luminaria a GIS(#211)",
  "_id": 3563,
  "_model": "gob_chajari_gestion_iluminacion.luminaria",
  "display_name": "LedSantaFe1425",
  "latitud": "-30.7633967",
  "longitud": "-57.9898921",
  "barrio": "San Clemente",
  "tipo_luminaria": "LED 150W",
  "direccion": "Santa Fe 1425",
  "sin_luz": false,
  "tipo_cableado": "Aéreo",
  "estado_base": "Con base en buenas condiciones",
  "medidor_id": false
}
```

Al eliminar:
```json
{
  "_action": "Sync luminaria a GIS (DELETE)(#...)",
  "_id": 3563,
  "_model": "gob_chajari_gestion_iluminacion.luminaria",
  "display_name": "LedSantaFe1425"
}
```

---

## Componente 2: Supabase Edge Functions

### Función: `smart-task` (CREATE / UPDATE)

Archivo: `supabase/functions/smart-task/index.ts`

Recibe el webhook de Odoo y hace UPSERT en `puntos_relevamiento`. Características:

- Resuelve `display_name` → `name` → `nombre` (orden de prioridad)
- Limpia coordenadas (saca prefijo `'` que Odoo a veces agrega)
- Normaliza nombre de barrio (sin tildes, sin espacios, minúsculas) y busca su UUID en tabla `barrios`
- Rechaza coordenadas inválidas o barrio desconocido con HTTP 400
- Hace upsert con `nombre` como clave única (evita duplicados entre CSV y webhook)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface LuminariaPayload {
  id?: number
  nombre?: string
  name?: string
  latitud?: any
  longitud?: any
  barrio?: any
  tipo_luminaria?: string
  sin_luz?: boolean
  tipo_cableado?: string
  estado_base?: string
  tipologia?: string
  direccion?: string
  observacion?: string
  medidor_id?: any
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  try {
    const payload: LuminariaPayload = await req.json()

    const nombreLuminaria = payload.nombre || payload.name || (payload as any).display_name || (payload.id ? `Luminaria-${payload.id}` : '')
    if (!nombreLuminaria) {
      return new Response(JSON.stringify({ error: 'Identificador no proporcionado', payload }), { status: 400 })
    }

    const lat = limpiarCoordenada(payload.latitud)
    const lng = limpiarCoordenada(payload.longitud)
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      return new Response(JSON.stringify({ error: 'Coordenadas inválidas', payload }), { status: 400 })
    }

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
        .from('barrios').select('id, nombre').limit(100)
      if (barrios) {
        const found = barrios.find(
          (b: any) => normalizarNombre(b.nombre) === barrioNormalizado
        )
        if (found) barrio_id = found.id
      }
    }

    if (!barrio_id) {
      return new Response(JSON.stringify({ error: `Barrio "${barrioNombre || 'no especificado'}" no encontrado` }), { status: 400 })
    }

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
    if (payload.sin_luz !== undefined) propiedades.sin_luz = payload.sin_luz
    if (payload.tipo_cableado) propiedades.cableado = payload.tipo_cableado
    if (payload.estado_base) propiedades.estado_base = payload.estado_base
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
        sin_luz: payload.sin_luz ?? false,
        estado_base: payload.estado_base || null,
        direccion: payload.direccion || null,
        barrio_nombre: barrioNombre || null,
      }, {
        onConflict: 'nombre',
        ignoreDuplicates: false,
      })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, nombre: nombreLuminaria }), { status: 200 })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
```

### Función: `smart-task-delete` (DELETE)

Archivo: `supabase/functions/smart-task-delete/index.ts`

Recibe el webhook de eliminación de Odoo y elimina el registro de `puntos_relevamiento` por nombre.

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeletePayload {
  _id?: number
  nombre?: string
  name?: string
  display_name?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  try {
    const payload: DeletePayload = await req.json()
    const nombreLuminaria = payload.nombre || payload.name || payload.display_name

    if (!nombreLuminaria) {
      return new Response(JSON.stringify({ error: 'No se pudo determinar el nombre a eliminar', payload }), { status: 400 })
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
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, nombre: nombreLuminaria, deleted: count }), { status: 200 })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
```

### Despliegue de Edge Functions

**Desde Supabase Dashboard (recomendado):**
1. Ir a **Edge Functions** → `Create a new function` (o seleccionar existente)
2. Elegir **Via editor** → pegar el código → **Deploy**
3. Ir a la función desplegada → desactivar **"Verify JWT with legacy secret"** (poner en OFF)

> **IMPORTANTE**: Si "Verify JWT" queda en ON, Odoo recibe HTTP 401 porque no envía cabeceras de autenticación. Ambas funciones (`smart-task` y `smart-task-delete`) deben tener JWT verification OFF.

**URLs de las funciones:**
- `smart-task`: `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task`
- `smart-task-delete`: `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task-delete`

---

## Componente 3: Supabase Realtime (Frontend)

La suscripción Realtime está implementada en el store de Zustand (`barrioStore.ts`). Escucha eventos INSERT, UPDATE y DELETE en la tabla `puntos_relevamiento` y actualiza el estado global, lo que hace que el mapa se redibuje automáticamente.

### Configuración en Supabase (ejecutar una vez en SQL Editor):

```sql
-- Habilitar Realtime en la tabla puntos_relevamiento
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.puntos_relevamiento;

-- Índice único para upsert (evita duplicados entre CSV y webhook)
CREATE UNIQUE INDEX IF NOT EXISTS puntos_relevamiento_nombre_unique
  ON public.puntos_relevamiento (nombre)
  WHERE nombre IS NOT NULL;
```

### Archivos del frontend involucrados:
- `src/stores/barrioStore.ts` — `subscribeToRealtime()` y `unsubscribeRealtime()`
- `src/App.tsx` — inicializa la suscripción al montar la app

---

## Componente 4: Importador CSV (Flujo Alternativo)

El importador CSV manual sigue disponible como respaldo en:
- `src/components/ImportadorDatos.tsx`

Sigue siendo útil para:
- Carga inicial masiva de datos
- Respaldos y restauración
- Situaciones donde Odoo no está disponible

El upsert por `nombre` garantiza que no haya duplicados entre CSV y webhook.

---

## Verificación del Sistema

Para confirmar que todo funciona:

1. **Crear** una luminaria en Odoo con latitud, longitud y barrio válido
2. **Verificar** que aparece en el mapa GIS en menos de 1 segundo
3. **Editar** algún campo de esa luminaria en Odoo → el mapa se actualiza
4. **Eliminar** la luminaria de Odoo → desaparece del mapa automáticamente
5. **Verificar en Supabase**: Table Editor → `puntos_relevamiento` confirma cada cambio

Si algo no funciona, revisar en Supabase Dashboard → **Edge Functions** → ver **Invocations** para ver errores.

---

## Troubleshooting

### El punto no aparece después de crearlo en Odoo
1. Verificar que la Regla de Automatización esté **Activa**
2. Verificar que el campo "Campos" del webhook NO esté vacío
3. Verificar en Supabase Dashboard → Edge Functions → `smart-task` → **Invocations** si llegó el request
4. Si hay 401, verificar que **Verify JWT** esté en OFF
5. Si hay error de barrio, verificar que el nombre coincida exactamente con la tabla `barrios` en Supabase

### El punto no desaparece al eliminarlo de Odoo
1. Verificar que la regla "Al eliminar" esté **Activa**
2. Verificar que la URL apunte a `smart-task-delete` (no a `smart-task`)
3. Verificar que **Verify JWT** esté en OFF en `smart-task-delete`
4. Verificar que `display_name` esté en el campo "Campos" del webhook de delete

### Odoo no envía el webhook
- Verificar que el módulo `base_automation` esté instalado
- Verificar conectividad de red: Odoo necesita acceso HTTPS saliente a `*.supabase.co:443`
- Si el certificado SSL de Odoo está vencido, no puede hacer conexiones HTTPS salientes

---

## Archivos Clave del Proyecto

| Archivo | Descripción |
|---|---|
| `supabase/functions/smart-task/index.ts` | Edge Function para CREATE / UPDATE |
| `supabase/functions/smart-task-delete/index.ts` | Edge Function para DELETE |
| `supabase/migrations/20260529_enable_realtime_puntos.sql` | Habilita Realtime en la tabla de puntos |
| `src/stores/barrioStore.ts` | Store con suscripción Realtime |
| `src/App.tsx` | Inicializa y limpia la suscripción Realtime |
| `src/components/ImportadorDatos.tsx` | Importador CSV manual (flujo alternativo) |

---

## Migración a Futuro (Nuevo Proyecto Supabase)

Si se crea un proyecto Supabase separado para producción:

| Componente | Cambio |
|---|---|
| **Odoo** | Actualizar URL del webhook en ambas reglas |
| **Edge Functions** | Redesplegar `smart-task` y `smart-task-delete` en el nuevo proyecto |
| **JWT** | Desactivar "Verify JWT" en ambas funciones |
| **Mapa Web** | Cambiar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |
| **Base de Datos** | Ejecutar migraciones SQL en el nuevo proyecto |
