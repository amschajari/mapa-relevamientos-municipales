# Hito: Sincronización estable Odoo ↔ Supabase (odoo_id)

> Fecha: 22/09/2026 · Rama: `feature/odoo_id`

## Resumen del hito

Se corrigió la **causa raíz** de los registros huérfanos/duplicados que aparecían en el
mapa (`puntos_relevamiento`) cuando se **editaba** una luminaria en Odoo
(especialmente al **renombrar** el ID Luminaria o cambiar su ubicación).

El sistema pasó a usar el **`id` nativo de Odoo** (`odoo_id`) como identidad estable
del registro, en lugar del `nombre` (display_name), que cambiaba con cada rename y
convertía un *update* en un *insert* nuevo, dejando la fila vieja huérfana.

**Resultado final verificado:** DB = 4185 registros = export de Odoo (4185), sin
obsoletos, sin faltantes, sin `odoo_id` duplicados, y test en vivo de rename/ubicación
sin generar conflictos.

## Qué resolvió

| Problema | Antes | Ahora |
|---|---|---|
| Rename en Odoo | INSERT de fila nueva + huérfana la vieja (duplicado) | UPDATE de la misma fila (usa `odoo_id`) |
| Cambio de ubicación | Podía generar conflicto | Actualiza en el mismo registro |
| Delete en Odoo | A veces fallaba y dejaba obsoletos | Borra por `odoo_id` con fallback por nombre |
| Verificación de datos | Manual y propensa a error | DB alineada 1:1 contra el export de Odoo |
| Conteo previo | 4185 DB / 4190 mapa con obsoletos | 4185 = 4185 |

## Cambios aplicados

### 1. Migración DB
`supabase/migrations/20260922_add_odoo_id_puntos.sql`

```sql
ALTER TABLE public.puntos_relevamiento ADD COLUMN IF NOT EXISTS odoo_id BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS puntos_relevamiento_odoo_id_unique
  ON public.puntos_relevamiento (odoo_id) WHERE odoo_id IS NOT NULL;
```

No destructiva: solo suma columna e índice único parcial.

### 2. Edge Function `smart-task` (create/update)
Lógica de upsert priorizando `odoo_id`:
1. Si llega `payload.id` → buscar por `odoo_id`:
   - existe → **UPDATE** (el rename actualiza la misma fila);
   - no existe pero hay **exactamente 1** registro con ese nombre y `odoo_id NULL` →
     UPDATE + asignar `odoo_id` (migración gradual);
   - 0 o >1 → INSERT (no toca ambigüedades).
2. Si no llega `id` → fallback al comportamiento histórico (upsert por `nombre`).

### 3. Edge Function `smart-task-delete`
1. Borra por `odoo_id` (`payload.id`/`_id`).
2. Fallback por `nombre` exacto (registros aún sin `odoo_id`).

### 4. Backfill de datos
Los 4185 registros existentes recibieron su `odoo_id` desde el export
`docs/odoo2209260825.csv` (fue el primer CSV que incluyó la columna `ID`).

### 5. Limpieza de huérfanos
Se eliminaron de la DB los registros que no existen en Odoo:
`LedSAntonio2080` y `LedSAntonio2185` (barrio San Antonio).

## Proceso seguido (fases)

- **Fase 0**: Backup completo de `puntos_relevamiento` (JSON) + rama `feature/odoo_id`.
- **Fase 1**: Diagnóstico (docs `PLAN_AUDITORIA_ODOO_ID.md` + auditoría) y confirmación
  de reglas de automatización de Odoo + método de deploy (Dashboard → Edge Functions).
- **Fase 2**: Migración aplicada en SQL Editor.
- **Fase 3**: Deploy de `smart-task` y `smart-task-delete` (Verify JWT OFF).
- **Fase 4**: Backfill de `odoo_id` (transaccional, archivo `backfill_odoo_id.sql` en temp).
- **Fase 5**: Borrado de huérfanos + verificación 4185 = 4185.
- **Fase 6**: Test en vivo — rename ida y vuelta, cambio de ubicación y creación/borrado
  de una ficticia; todo OK sin residuos.

## Reversión

| Cambio | Rollback |
|---|---|
| Código de funciones | Restaurar versión anterior en Dashboard (Edge Functions) / `git revert` |
| Migración | `ALTER TABLE ... DROP COLUMN odoo_id;` + `DROP INDEX ...` |
| Datos borrados (huérfanos) | Backup `backup_puntos_20260922.json` (4187 filas prefase) |

> Los 2 huérfanos borrados no existen en Odoo, por lo que el rollback de datos es
> opcional; la DB ahora es la fuente correcta.

## Alineación con la auditoría

- **Obs 1** (ambigüedad 0/>1 matches): resuelta en `smart-task` (solo 1 match → update).
- **Obs 2** (orden backfill → reconcile): respetado.
- **Obs 3** (`odoo-sync` duplicada): confirmada como no usada → candidata a archivar
  (pendiente, opcional).
- **Obs 4** (JWT OFF): se mantiene OFF como estaba documentado; pendiente evaluar secret.
- **Obs 5** (realtime por UUID): verificada OK — `barrioStore.ts` usa `payload.new.id`
  (UUID), no el nombre.

## Pendientes / recomendaciones

- [ ] (Opcional) Archivar la Edge Function `odoo-sync` (duplicada de `smart-task`).
- [ ] (Opcional) Migración de la tabla a GRANTs explícitos si se recrea
  (post-Oct/2026).
- [ ] (Recomendado) Reconciliación periódica contra el export de Odoo
  (`smart-task-reconcile`) como red de seguridad.
- [ ] Crear PR/merge de `feature/odoo_id` → `main`.

## Archivos relevantes

- `supabase/migrations/20260922_add_odoo_id_puntos.sql`
- `supabase/functions/smart-task/index.ts`
- `supabase/functions/smart-task-delete/index.ts`
- `docs/odoo2209260825.csv` (export con columna `ID`)
- `docs/PLAN_AUDITORIA_ODOO_ID.md`
- `docs/auditoria_plan_odoo_id_20260922.md`