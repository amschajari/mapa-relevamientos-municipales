# Problema: Delete Webhook no confiable

## Síntoma

Cuando se elimina una luminaria en Odoo, el webhook `smart-task-delete` no siempre elimina el registro correspondiente en `puntos_relevamiento` de Supabase. Esto deja **registros huérfanos** en el mapa.

### Ejemplos concretos

| Fecha | Registros huérfanos | Causa |
|---|---|---|
| 24/06 | `LedSantaFe1425` | Test creada y borrada de Odoo, delete webhook falló |
| 24/06 | `LedAvBelgeano2010` | Typo corregido en Odoo, el rename generó un duplicado y el viejo no se eliminó |
| 24/06 | `Led1erodeMayo3205`, `Led1erodeMayo3295`, `Led1erodeMayo3245`, `Led1eroMayo3295` | Se crearon sin el prefijo "Av", se borraron de Odoo y se recrearon con nombre correcto. El delete webhook no eliminó los viejos de Supabase |

## Causa Raíz

El `smart-task-delete` (Edge Function) no se ejecuta correctamente cuando Odoo envía el webhook de eliminación. Posibles causas:

1. La regla de automatización "Al eliminar" en Odoo no está activa o mal configurada
2. El campo `display_name` no se incluye en los campos del webhook de delete
3. JWT verification no está desactivada en la función `smart-task-delete`
4. Problema de red: Odoo no puede alcanzar `*.supabase.co` al eliminar

## Soluciones Propuestas

### 1. Revisar y reparar el webhook de delete (causa raíz)

Verificar en Supabase Dashboard:

- [ ] Ir a **Edge Functions** → `smart-task-delete` → **Invocations**
- [ ] Revisar si hay errores 401 (JWT verification) o 400/500
- [ ] Confirmar que **Verify JWT** esté en OFF

Verificar en Odoo:

- [ ] `Ajustes → Técnico → Automatización → Reglas de automatización`
- [ ] Regla "Sync luminarias → GIS (DELETE)" debe estar **Activa**
- [ ] El campo "Campos" debe incluir `display_name`
- [ ] La URL debe apuntar a `.../functions/v1/smart-task-delete`

### 2. Edge Function de reconciliación automática

Crear una función que reciba la lista completa de nombres desde Odoo (vía CSV o POST) y elimine los huérfanos en Supabase.

```
POST /functions/v1/reconcile
Body: { "nombres": ["LedXxx123", "LedYyy456", ...] }
```

La función:
1. Recibe el array de nombres válidos desde Odoo
2. Consulta todos los nombres en `puntos_relevamiento`
3. Elimina los que no están en la lista de Odoo
4. Responde con la cantidad de eliminados

**Ventaja**: se puede llamar manualmente después de cada exportación de Odoo, o automatizar.

### 3. Botón de sincronización en el frontend

Agregar un botón "Sincronizar" en el mapa que llame a la función de reconciliación. Útil para que cualquier usuario pueda resolver inconsistencias sin intervención técnica.

## Problema Adicional: Duplicados en Odoo

Aparecieron registros con el mismo `display_name` en Odoo (ej: `LedAv9deJulio3150` x2). El webhook intenta crear el segundo y falla por el unique constraint en `nombre` de Supabase. 

A revisar en Odoo:

- Verificar en `Luminarias` si hay dos registros con igual nombre
- El módulo `gob_chajari_gestion_iluminacion.luminaria` debería prevenir o alertar sobre duplicados de `display_name`

La función de reconciliación (**Opción 2**) también detectaría y reportaría estos casos.

## Recomendación

Empezar por **Opción 1** (revisar el webhook de delete). Si persiste el problema, implementar **Opción 2** (reconciliación).
