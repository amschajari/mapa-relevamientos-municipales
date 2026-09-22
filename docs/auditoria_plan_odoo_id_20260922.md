# Auditoría: `PLAN_AUDITORIA_ODOO_ID.md`

> **Fecha de auditoría**: 22/09/2026  
> **Documento auditado**: `docs/PLAN_AUDITORIA_ODOO_ID.md`  
> **Estado**: Aprobado condicionalmente — sin cambios aplicados aún.

---

## Veredicto general

✅ **Plan aprobado condicionalmente.**

El plan está bien estructurado, la causa raíz está correctamente identificada y la solución propuesta es sólida. Puede avanzarse a implementación una vez resueltas las acciones previas detalladas al final de este documento.

---

## Lo que está bien

- **Causa raíz correctamente identificada**: el uso de `nombre` como clave de identidad es el problema central, y agregar `odoo_id` como columna estable es la solución correcta.
- **Migración no destructiva** (§5.1): `ADD COLUMN IF NOT EXISTS` + índice único parcial con `WHERE odoo_id IS NOT NULL` — correcto, no rompe registros existentes ni obliga a backfill inmediato.
- **Fallback gradual** (§5.2): la lógica de "buscar por `odoo_id`, si no existe buscar por nombre con `odoo_id IS NULL`" es la estrategia de migración gradual correcta.
- **Backfill con fuente documentada** (§5.4): usar el CSV del 22/09 con columna `ID` y abortar en conflicto es prudente.
- **Riesgos explícitamente tabulados** (§7): bien listados.

---

## Observaciones y preguntas

### ⚠️ Obs. 1 — §5.2: Ambigüedad en el caso "nombre con `odoo_id IS NULL`"

> Si no existe por `odoo_id`, buscar **único** registro por `nombre` con `odoo_id IS NULL`

¿Qué pasa si hay **más de uno** con ese nombre y `odoo_id IS NULL`? (Por ejemplo, los case-variants `pilar`/`Pilar`). El código debería definir explícitamente:

- Si hay exactamente **1 match** → actualizar y asignar `odoo_id`.
- Si hay **0 o >1** → hacer **INSERT** (o loguear el conflicto sin crashear).

Esto debería quedar explícito en el documento o en el código de `smart-task`.

---

### ⚠️ Obs. 2 — §5.5: Orden de limpieza de huérfanos

Los 4 huérfanos del barrio San Isidro (`LedGCastro2750`, `LedTraPilar4515`, `LedTRAPilar4585`, `LedTraPilar4405`) están identificados. Falta claridad sobre si se eliminan **antes** o **después** del backfill de `odoo_id`.

**Recomendación**: hacer **primero el backfill → luego el reconcile**.  
Razonamiento: si tras el backfill el huérfano queda sin `odoo_id` asignado, es confirmación adicional de que es obsoleto. El delete queda auditado de forma natural.

---

### ⚠️ Obs. 3 — §5.6: `odoo-sync` como función duplicada (¿confirmado?)

La tabla de §2 la lista como "posible función obsoleta" pero no está confirmado.

**Pregunta**: ¿Ya se verificó que `odoo-sync` **no está siendo invocada actualmente** por ninguna regla de Odoo activa?  
Eliminarla sin verificar podría cortar un flujo no documentado.

---

### ⚠️ Obs. 4 — §7 Riesgo 2: Verify JWT OFF en `smart-task-delete`

Tener JWT OFF expone el endpoint públicamente. Considerar si se puede usar un **secret compartido** (header personalizado validado dentro de la función) en lugar de deshabilitar JWT completamente.

---

### ⚠️ Obs. 5 — §6.5: Verificación de Realtime / frontend

La verificación menciona que "los eventos siguen propagándose". Convendría especificar:  
¿Hay algún caso edge donde un **UPDATE** con cambio de `nombre` en Supabase rompa el estado del frontend?  
Por ejemplo: ¿`barrioStore.ts` filtra registros por `nombre` en lugar de por el UUID de la fila?

---

## 🔴 Pregunta bloqueante (antes de proceder)

> **¿El payload de *todos* los webhooks de Odoo (create, update, delete) incluye siempre el campo `id` numérico?**

Si el campo `id` llega vacío en algún caso (por ejemplo, una regla de automatización mal configurada que no lo incluye en el payload), el fallback por `nombre` se activa y el problema persiste sin que nadie lo note.

**Acción requerida**: verificar los **logs de invocaciones** de `smart-task` en Supabase Dashboard antes de aplicar la migración, confirmando que `id` está presente en todos los eventos.

---

## Acciones previas al merge

| # | Acción | Quién |
|---|---|---|
| 1 | Verificar logs de invocación de `smart-task` → confirmar que `id` siempre está presente en el payload | Dev |
| 2 | Confirmar si `odoo-sync` tiene reglas activas en Odoo antes de archivarla | Dev / Admin Odoo |
| 3 | Definir comportamiento exacto de `smart-task` cuando hay 0 o >1 registros con ese nombre y `odoo_id IS NULL` | Dev |
| 4 | Confirmar orden de ejecución: **backfill primero → reconcile después** | Dev |
| 5 | Evaluar alternativa a JWT OFF en `smart-task-delete` (header secret) | Dev / Seguridad |

---

## Próximo paso recomendado

Una vez resueltas las acciones 1–5 (especialmente la **#1** y la **#3**), el plan puede ejecutarse en el orden:

1. Aplicar migración SQL (`20260922_add_odoo_id_puntos.sql`).
2. Desplegar `smart-task` y `smart-task-delete` actualizados.
3. Ejecutar backfill de `odoo_id` desde `docs/odoo2209260825.csv`.
4. Ejecutar reconcile/limpieza de huérfanos.
5. Verificar conteo: DB vs export → 4185 = 4185.
6. (Opcional) Archivar `odoo-sync` si se confirma inactiva.
