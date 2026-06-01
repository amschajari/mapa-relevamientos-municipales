# Guía Técnica: Integración y Despliegue en Producción
## Odoo 19 ↔ Supabase GIS — Tiempo Real

> **Estado**: ✅ Implementado y verificado en ambiente de desarrollo (01/06/2026)  
> **Autor**: Equipo GIS — Municipalidad de Chajarí

Esta guía documenta la arquitectura técnica del sistema, el flujo de comunicación actual en desarrollo, y detalla paso a paso cómo migrar todo el ecosistema de un ambiente local/desarrollo a un entorno de **Servidor a Servidor en Producción**.

---

## 🌟 Qué se logró

Cuando un usuario **crea o modifica una luminaria en Odoo**, esa luminaria aparece **automáticamente en el mapa web GIS en menos de un segundo**, sin recargar la página, gracias a la combinación de tres tecnologías:

- **Odoo 19** → dispara un webhook nativo al guardar una luminaria.
- **Supabase Edge Function** → recibe el dato, lo procesa y lo inserta en la base de datos.
- **Supabase Realtime + React** → el mapa escucha cambios en la base de datos y redibuja el punto al instante.

---

## 🗺️ Arquitectura y Flujo de Comunicación

```
Odoo (8069)  ──── POST HTTPS ────▶  Supabase Edge Function
                                        (smart-task / nube)
                                              │
                                         UPSERT en
                                    puntos_relevamiento
                                              │
                                    Supabase Realtime
                                    (WebSocket / nube)
                                              │
                                              ▼
                               Mapa GIS React
                          (localhost:5173 / GitHub Pages)
```

### Detalle del flujo paso a paso:
1. El usuario **guarda una luminaria** en Odoo (crear o editar).
2. La **Regla de Automatización** de Odoo dispara automáticamente un `POST` HTTPS con los datos de la luminaria en formato JSON hacia la URL de Supabase.
3. La **Edge Function `smart-task`** recibe el JSON:
   - Extrae el identificador (`display_name`).
   - Normaliza el nombre del barrio y resuelve su UUID en la tabla `barrios`.
   - Hace un `UPSERT` en la tabla `puntos_relevamiento`.
4. **Supabase Realtime** detecta el cambio en la tabla y transmite el evento via WebSocket a todos los clientes conectados.
5. El **mapa React** recibe el evento y redibuja la nueva luminaria en su posición geográfica al instante.

---

## 🛠️ Cambios realizados por componente

### Componente 1: Odoo 19 — *Cero código Python, cero módulos nuevos*

> **¿Por qué no se usó código Python?**  
> Odoo 19 ejecuta el código de acciones de servidor en un sandbox de seguridad (`safe_eval`) que bloquea explícitamente cualquier `import` de librerías externas (`urllib`, `requests`, etc.), generando errores como `forbidden opcode: IMPORT_NAME` o `NameError: name 'requests' is not defined`. La opción nativa de webhook evita todo eso de forma limpia y oficial.

**Módulo necesario**: `base_automation` (Reglas de Automatización) — ya incluido en Odoo 19.

**Configuración en la interfaz** (Modo Desarrollador activado):

- Ir a: `Ajustes → Técnico → Automatización → Reglas de automatización`
- Crear una nueva regla con estos parámetros:

| Campo | Valor |
|---|---|
| **Nombre** | `Sync luminarias → GIS` |
| **Modelo** | `gob_chajari_gestion_iluminacion.luminaria` |
| **Disparador** | Al crear y editar |
| **Tipo de Acción** | `Enviar notificación webhook` ← nativo Odoo 19 |
| **URL** | `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task` |
| **Campos enviados** | `display_name`, `latitud`, `longitud`, `barrio`, `direccion`, `tipo_cableado`, `estado_base`, `observacion`, etc. |

**Formato del JSON que Odoo envía automáticamente:**
```json
{
  "_action": "Sync luminaria a GIS(#211)",
  "_id": 3563,
  "_model": "gob_chajari_gestion_iluminacion.luminaria",
  "barrio": "San Clemente",
  "direccion": "Santa Fe 1425",
  "display_name": "LedSantaFe1425",
  "estado_base": "buena",
  "id": 3563,
  "latitud": "-30.7633967",
  "longitud": "-57.9898921",
  "observacion": false,
  "tipo_cableado": "aereo"
}
```

---

### Componente 2: Supabase Edge Function — `supabase/functions/smart-task/index.ts`

Función serverless en **Deno (TypeScript)** que actúa como puente inteligente entre Odoo y la base de datos. Características clave:

- **Resolución de identificador**: busca `display_name` → `name` → `nombre` en ese orden de prioridad.
- **Parseo robusto del barrio**: acepta el barrio como `string`, como arreglo `[id, "Nombre"]` (relación Many2one de Odoo) o como objeto.
- **Normalización de nombres**: elimina tildes, espacios y mayúsculas para comparar sin errores (`"San Clemente"` == `"san clemente"` == `"sanclemente"`).
- **UPSERT seguro**: usa la columna `nombre` como clave única para evitar duplicados.
- **Desplegada sin JWT** (`--no-verify-jwt`): permite que Odoo haga el POST sin necesidad de cabeceras de autenticación complejas.

**Comando de despliegue:**
```bash
npx supabase functions deploy smart-task --project-ref elczfqaevdnomwflgvka --no-verify-jwt
```

---

### Componente 3: Frontend React — Supabase Realtime

Archivos modificados:
- `src/stores/barrioStore.ts` — suscripción y desuscripción al canal Realtime.
- `src/App.tsx` — inicializa la suscripción al montar la app y la limpia al desmontar.

**Lógica implementada:**
- Se suscribe al canal `postgres_changes` de la tabla `puntos_relevamiento`.
- Reacciona a eventos `INSERT`, `UPDATE` y `DELETE` actualizando el estado global.
- El mapa redibuja los puntos automáticamente al cambiar el estado.

**Requisito en Supabase** (ejecutar una sola vez en el SQL Editor):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.puntos_relevamiento;
```

---

## 🚀 Migración a Producción (Servidor a Servidor)

### Escenario: Odoo Municipal Online + Supabase actual

Este es el escenario más simple. El Odoo de la municipalidad ya está online, y queremos conectarlo al mismo Supabase que usamos en desarrollo.

**Pasos:**

1. **En el Odoo Municipal** (acceso de administrador requerido):
   - Activar Modo Desarrollador.
   - Instalar módulo `base_automation` si no está instalado.
   - Crear la misma Regla de Automatización descripta arriba.
   - La URL del webhook es exactamente la misma: `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task`

2. **Edge Function**: No requiere ningún cambio. Ya está desplegada en la nube.

3. **Mapa Web**: Si se despliega en GitHub Pages (configuración actual), no requiere cambios. Si se aloja en un servidor propio, subir el contenido de la carpeta `/dist` generada por `npm run build`.

> **Requisito de red del Odoo municipal**: El servidor solo necesita acceso de **salida** a internet en el puerto 443 (HTTPS) hacia `*.supabase.co`. No se requiere abrir puertos de entrada en la red municipal.

---

### Escenario: Nuevo Supabase de Producción (Separado)

Si en el futuro se decide crear un proyecto Supabase separado exclusivamente para producción:

**Tabla de cambios necesarios:**

| Componente | Cambio | Dónde |
|---|---|---|
| **Odoo** | Actualizar la URL del webhook al nuevo dominio de Supabase | Regla de Automatización en Odoo |
| **Edge Function** | Redesplegar en el nuevo proyecto | `npx supabase functions deploy smart-task --project-ref <NUEVO-REF> --no-verify-jwt` |
| **Mapa Web** | Cambiar variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` | Archivo `.env` del servidor o Secrets de GitHub Actions |
| **Base de Datos** | Correr las migraciones SQL del proyecto en el nuevo Supabase | SQL Editor del nuevo proyecto |

**Variables de entorno del mapa para producción:**
```env
VITE_SUPABASE_URL=https://<NUEVO-PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<NUEVA-ANON-KEY>
```

---

## ✅ Verificación del sistema

Para confirmar que el flujo funciona correctamente en cualquier ambiente:

1. Crear o editar una luminaria en Odoo (con latitud, longitud y barrio válido).
2. Guardar el registro.
3. Observar el mapa GIS: la luminaria debe aparecer **en menos de 1 segundo** sin recargar la página.
4. Verificar en Supabase Dashboard → Table Editor → `puntos_relevamiento` que el registro fue insertado.

---

## 📁 Archivos clave del proyecto

| Archivo | Descripción |
|---|---|
| `supabase/functions/smart-task/index.ts` | Edge Function principal (puente Odoo → Supabase) |
| `supabase/migrations/20260529_enable_realtime_puntos.sql` | Habilita Realtime en la tabla de puntos |
| `src/stores/barrioStore.ts` | Store con suscripción Realtime (funciones `subscribeToRealtime` / `unsubscribeRealtime`) |
| `src/App.tsx` | Inicializa y limpia la suscripción Realtime |

---

## 🔮 Mejoras Pendientes

### ⬜ Sincronización de BORRADO Odoo → Supabase

**Estado**: Pendiente de implementar  
**Prioridad**: Media

#### Contexto
La sincronización actual cubre los eventos **CREATE** y **UPDATE** de luminarias. Sin embargo, cuando se **elimina** una luminaria en Odoo, el punto correspondiente **permanece en Supabase** y continúa visible en el mapa (queda "huérfano"). El borrado manual debe hacerse directamente en el SQL Editor de Supabase.

#### Solución propuesta

Requiere dos cambios: una segunda Regla de Automatización en Odoo y soporte para DELETE en la Edge Function.

**Paso 1 — Nueva Regla de Automatización en Odoo:**
- **Nombre**: `Sync luminarias → GIS (DELETE)`
- **Modelo**: `gob_chajari_gestion_iluminacion.luminaria`
- **Disparador**: Al borrar *(Before Delete)*
- **Tipo de Acción**: `Enviar notificación webhook`
- **URL**: `https://elczfqaevdnomwflgvka.supabase.co/functions/v1/smart-task-delete`
- **Campos enviados**: solo `display_name` (es suficiente para identificar el punto a borrar)

**Paso 2 — Nueva Edge Function `smart-task-delete`:**

Crear el archivo `supabase/functions/smart-task-delete/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  try {
    const payload = await req.json()
    const nombre = payload.display_name || payload.nombre || payload.name

    if (!nombre) {
      return new Response(JSON.stringify({ error: 'Identificador no proporcionado' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase
      .from('puntos_relevamiento')
      .delete()
      .eq('nombre', nombre)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, eliminado: nombre }), { status: 200 })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
```

**Paso 3 — Desplegar la nueva función:**
```bash
npx supabase functions deploy smart-task-delete --project-ref elczfqaevdnomwflgvka --no-verify-jwt
```

#### Consideración importante
Odoo ejecuta el webhook *antes* de eliminar el registro (trigger *Before Delete*). Esto garantiza que `display_name` todavía está disponible en el payload cuando se llama al endpoint.
