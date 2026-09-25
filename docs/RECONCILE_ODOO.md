# Reconciliación Odoo ↔ Mapa (`reconcile-odoo.mjs`)

Detector de diferencias entre el export CSV de Odoo y la tabla `puntos_relevamiento`
(Supabase, lo que muestra el mapa). Sin dependencias: solo Node 18+.

## Cómo correrlo

```bash
node scripts/reconcile-odoo.mjs docs/odoo250926_900.csv
node scripts/reconcile-odoo.mjs docs/odoo250926_900.csv --json reporte.json
```

- Las credenciales las lee de `.env.local` (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- Exit code `0` = sin diferencias · `1` = hay diferencias (sirve para cron/CI).
- Corrélo cada vez que exportes un CSV nuevo de Odoo, o cuando los conteos no cierren.

## Qué muestra

```
FALTAN EN MAPA:    N   ← en Odoo, no en Supabase (con barrio, dirección y causa probable)
SOBRAN EN MAPA:    N   ← en Supabase, no en el CSV (obsoletos, o más nuevos que el CSV)
RECHAZADOS *:      N   ← filas que el Importador descartaría (coords inválidas, barrio
                         desconocido, sin ID)
```

## Cómo interpretar

| Caso | Significado | Acción |
|---|---|---|
| Faltan, causa "nunca importada" | El registro existe en Odoo pero ningún archivo importado lo trajo | Importar en modo **merge** |
| Faltan, causa "coords inválidas" | El importador la salta **en silencio** | Corregir coords en Odoo y reimportar |
| Faltan, causa "barrio no matchea" | El nombre de barrio no existe igual en `barrios` | Normalizar el nombre en Odoo o crear el barrio |
| Sobran | Registro en el mapa que no está en el CSV | Si es más nuevo que el export (ver `created_at`/`odoo_id`), no hacer nada; si no, es obsoleto → borrar |
| Todo en 0 | Bases sincronizadas | Nada |

## Notas

- La clave de comparación es `ID Luminaria` (nombre). Si el CSV trae la columna
  numérica `ID`, el match también considera `odoo_id` donde exista.
- Replica las reglas de `src/components/ImportadorDatos.tsx` (validez de coords,
  normalización de barrio), así que predice exactamente qué haría una importación.
- Un CSV viejo genera "sobrantes" falsos: los registros creados en Odoo después
  del export (vía webhook realtime) aparecen como sobrantes. Compará siempre
  contra el export más reciente.
