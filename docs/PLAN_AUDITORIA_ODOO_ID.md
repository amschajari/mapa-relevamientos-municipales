# Plan de Auditoría: Registros huérfanos y duplicados en `puntos_relevamiento`

> Documento para revisión de un auditor externo antes de implementar cambios.
> Estado: **PROPUESTA — sin cambios aplicados**.

---

## 1. Resumen ejecutivo

El problema son los **registros huérfanos y duplicados** que aparecen en la tabla
`puntos_relevamiento` de Supabase cuando se **edita** (especialmente se **renombra**)
una luminaria en Odoo. El sistema de sincronización usa el **nombre** (`display_name`)
como única identidad, por lo que un rename genera una fila nueva y deja la anterior
huérfana. Se propone incorporar el **`id` nativo de Odoo** (`odoo_id`) como identidad
estable, con fallback gradual.

---

## 2. Contexto del sistema

- **Odoo**: sistema maestro de luminarias (`gob_chajari_gestion_iluminacion.luminaria`).
- **Supabase** (ref `elczfqaevdnomwflgvka`): tabla geoespacial `puntos_relevamiento`
  (PostGIS) que alimenta el mapa (`Leaflet + react-leaflet`).
- **Sincronización**: webhooks de Odoo → Edge Functions de Supabase
  (patrón de automatización "Sync luminarias → GIS").
- El payload de los webhooks incluye el **`id` numérico nativo de Odoo** (ej: `"id": 8`),
  pero hoy esa información **se descarta**.

### Webhooks / Edge Functions involucradas

| Función | Uso | Clave de identidad |
|---|---|---|
| `smart-task` | create/update luminaria | `nombre` (upsert `onConflict: 'nombre'`) |
| `odoosync`/`odoo-sync` | duplicado de `smart-task` (posible función obsoleta) | `nombre` |
| `smart-task-delete` | delete luminaria | `nombre` exacto |
| `smart-task-reconcile` | reconciliación manual por lista completa | `nombre` |

---

## 3. Síntomas observados (evidencia)

Diferencia detectada el 21–22/09/2026 entre el export de Odoo y la DB de Supabase:

- Odoo (CSV export 09:33): **4185** luminarias.
- Supabase: **4190** registros.

Desglose de la diferencia (+4):

| Tipo | Registro(s) | Detalle |
|---|---|---|
| +1 duplicado | `LedTratadodelpilar5190` vs `LedTratadodelPilar5190` | Mismo ID Luminaria con distinta capitalización |
| +1 caso previo | `LedVirgendeLujan1930` vs `LedVirgenDeLujan1930` | Ídem, dos barrios distintos |
| +4 obsoletos | `LedGCastro2750`, `LedTraPilar4515`, `LedTRAPilar4585`, `LedTraPilar4405` (barrio San Isidro) | Luminarias renombradas a "Tratado del Pilar" en Odoo; la versión vieja quedó huérfana |
| −1 faltante | `LedMartinFierro760` | En DB figuraba en barrio erróneo (Curiyú); el CSV nuevo (10:25, `odoo2209260825.csv`) lo confirma en Curiyú con `odoo_id=5028` → dato correcto |

Historial previo documentado (24/06): `LedSantaFe1425`, `LedAvBelgeano2010`,
`Led1erodeMayo3205`… — huérfanos por rename/delete no reflejados
(ver `docs/problema_delete_webhook.md`).

---

## 4. Diagnóstico (causa raíz)

**Causa raíz principal: la identidad del registro en Supabase es el `nombre` y no existe
columna `odoo_id`.**

Mecanismo del problema cuando se **renombra** el ID Luminaria en Odoo:

1. Odoo dispara el webhook de **update** (`smart-task`) con el **display_name nuevo**.
2. `smart-task` hace `upsert(..., { onConflict: 'nombre' })`.
3. El nombre nuevo **no existe** en `puntos_relevamiento` → **INSERT** de una fila nueva.
4. La fila con el nombre **viejo** nunca se toca → queda **huérfana/duplicada**.
   Odoo ve la operación como *update*, por lo que **no** dispara el webhook de *delete*.

Causas secundarias / agravantes:

1. **Índice único case-sensitive**: `puntos_relevamiento_nombre_unique` sobre `nombre`
   (`WHERE nombre IS NOT NULL`) permite variantes por mayúsculas/acentos
   (`pilar`/`Pilar`, `Virgende`/`VirgenDe`) como registros separados.
2. **Webhook de delete poco confiable**: `smart-task-delete` depende de que la regla de
   automatización en Odoo esté activa, incluya `display_name` y tenga **Verify JWT OFF**
   (causas documentadas en `docs/problema_delete_webhook.md`).
3. **Coincidencia y recortes**: el CSV de Odoo exportado no incluye el `id` numérico en
   versiones anteriores; sólo el export del 22/09/2026 (`odoo2209260825.csv`) lo trae
   como primera columna `ID`.

**Conclusión**: sin un `odoo_id`, es imposible saber que el nombre nuevo *es* la misma
luminaria que el nombre viejo, y el sistema no puede distinguir insert de rename.

---

## 5. Plan propuesto

### 5.1 Migración DB (nueva tabla ya no; adición de columna)

Archivo: `supabase/migrations/20260922_add_odoo_id_puntos.sql`

```sql
ALTER TABLE public.puntos_relevamiento ADD COLUMN IF NOT EXISTS odoo_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS puntos_relevamiento_odoo_id_unique
  ON public.puntos_relevamiento (odoo_id)
  WHERE odoo_id IS NOT NULL;
```

- Tabla existente pre-Oct/2026 → **no** requiere GRANTs explícitos nuevos
  (ver CLAUDE.md, sección "Migraciones de Supabase").
- No hay cambio de tipo ni pérdida de datos.

### 5.2 `smart-task` (create/update) — upsert priorizando `odoo_id`

Nueva lógica:

1. Si `payload.id` está presente:
   - Buscar por `odoo_id` → si existe, **update** (un rename actualiza la misma fila).
   - Si no existe por `odoo_id`, buscar **único** registro por `nombre` con
     `odoo_id IS NULL` → **update + asignar `odoo_id`** (migración gradual de datos existentes).
   - Si no existe ninguno → **insert** con `odoo_id`.
2. Fallback: si no llega `id`, mantener el comportamiento actual (upsert por `nombre`).

### 5.3 `smart-task-delete` (delete)

- Priorizar borrado por `odoo_id` (`payload.id`).
- Fallback por `nombre` (comportamiento actual).
- Mantener `service_role` para operaciones.

### 5.4 Backfill de `odoo_id` (datos existentes)

- Fuente: export **`docs/odoo2209260825.csv`** (4185 filas, incluye columna `ID`).
- Script SQL/PS que cruza `ID ↔ display_name` y actualiza `odoo_id` donde sea NULL.
- En caso de conflicto (mismo `odoo_id` en dos filas), se reporta y no se aplica (ABORT).

### 5.5 Limpieza de huérfanos existentes

- Usar `smart-task-reconcile` o script puntual contra el CSV nuevo para eliminar los
  registros que no existen en Odoo (sólo los confirmados como obsoletos).

### 5.6 (Opcional) Unificar funciones

- Eliminar/archivar `odoo-sync` (función duplicada de `smart-task`).
- Revisar reglas duplicadas "Sync luminarias → GIS" en Odoo (dejar una sola con todos
  los campos).

---

## 6. Verificación post-implementación

1. **Rename en Odoo**: renombrar un ID Luminaria → en Supabase se debe **actualizar la
   misma fila** (mismo `id` UUID, `odoo_id` persistente), sin duplicados.
2. **Delete en Odoo**: eliminar una luminaria → se debe borrar el registro en Supabase.
3. **Conteo DB vs export**: `diff0933.ps1` / comparativa con `odoo2209260825.csv`
   → **4185 = 4185**, sin barrios con diferencias.
4. **Índices**: `puntos_relevamiento_odoo_id_unique` presente y sin filas duplicadas
   (consulta de pre-check previa al `CREATE UNIQUE INDEX`).
5. **Realtime/frontend** (`barrioStore.ts`): los eventos INSERT/UPDATE/DELETE siguen
   propagándose al mapa.

---

## 7. Riesgos y decisiones pendientes para el auditor

| # | Asunto | Pregunta / Riesgo |
|---|---|---|
| 1 | **Reglas de Odoo** | ¿Confirmar endpoint activo real (hay `smart-task` y `odoo-sync`)? ¿Reglas duplicadas? |
| 2 | **Verify JWT** | En `smart-task-delete` debe estar OFF; verificar invocations (401 actuales). |
| 3 | **Backfill** | Impacto de poblar `odoo_id` masivamente; una sola corrida idempotente. |
| 4 | **Rename histórico** | La migración gradual puede dejar algunos sin `odoo_id` hasta su próximo edit. |
| 5 | **Barrios con nombres iguales / case variants** | Índice `nombre` sigue case-sensitive; los case-variants de hoy se resuelven por `odoo_id` en adelante, no se normaliza el índice. |

---

## 8. Archivos de referencia

- `docs/problema_delete_webhook.md` — historial del problema del delete webhook.
- `docs/odoo2209260825.csv` — export vigente 22/09/2026 (4185 filas, con columna `ID`).
- `supabase/functions/smart-task/index.ts` — función create/update a modificar.
- `supabase/functions/smart-task-delete/index.ts` — función delete a modificar.
- `supabase/functions/odoo-sync/index.ts` — función duplicada candidata a archivar.
- `supabase/functions/smart-task-reconcile/index.ts` — reconciliación manual.
- `supabase/migrations/20260315_add_puntos.sql` — esquema base / RLS.
- `supabase/migrations/20260529_enable_realtime_puntos.sql` — índice único `nombre` + realtime.
- `src/stores/barrioStore.ts` — suscripción realtime del frontend.

---

## 9. Próximo paso

Esperar el resultado de la **auditoría** de este documento antes de aplicar cualquier
cambio. Ningún archivo de código/SQL fue modificado aún.