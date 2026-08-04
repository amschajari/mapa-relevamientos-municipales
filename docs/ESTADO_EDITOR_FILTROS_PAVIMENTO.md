# Estado del Proyecto — Filtros de Pavimento + Editor

## Rama Activa

`feature/filtros-pavimento`

## Contexto General

Sistema de gestión de calles pavimentadas para la Municipalidad de Chajarí. Los vectores (892 segmentos) fueron generados por IA a partir de un PNG del callejero como "calles pavimentadas actuales". Algunas calles no están pavimentadas en la realidad y se marcan como **descartadas**.

## Categorías de Calles (en el mapa)

| Categoría | Estado | Color | Descripción |
|-----------|--------|-------|-------------|
| Con datos municipales | `conservado` con `observaciones` | Celeste (#0ea5e9) | Tiene ordenanza, tipo de obra, fechas (extraído de digesto municipal) |
| Pendientes | `pendiente` | Amarillo (#eab308) | Existe pero sin clasificar ni datos municipales |
| Descartadas | `descartado` | Rojo (#ef4444) | No está pavimentada en la realidad (visible con toggle) |

## Filtros Implementados (LayerSettingsPanel)

Capa `pavimento-todas` en el LayersPanel del mapa principal:

1. **Mostrar descartadas** — toggle ON/OFF (default: OFF). Cuando está OFF, los segmentos con `estado = 'descartado'` no se renderizan.
2. **Datos municipales** — toggle "Solo con datos" / "Todas" (default: Todas). Cuando está en "Solo con datos", solo se muestran segmentos con `observaciones` no nulo.

## Store

Los filtros se almacenan en `barrioStore.mapFilters`:

```typescript
mapFilters: {
  barrio: string
  estadosBase: string[]
  funcionamiento: string[]
  pavimentoMostrarDescartadas: boolean
  pavimentoSoloConDatos: boolean
}
```

## Archivos Modificados

- `src/stores/barrioStore.ts` — nuevo campos en `mapFilters`
- `src/components/LayerSettingsPanel.tsx` — UI de filtros para `pavimento-todas`
- `src/components/PavimentoLayer.tsx` — filtrado con `useMemo`, colores por estado, tooltips deshabilitados

## Editor de Calles (offline)

`docs/editor_calles_pavimentadas_v2.html`

- Editor HTML que se abre con doble click (file://)
- Carga 892 segmentos desde Supabase (fallback a GeoJSON local)
- Funcionalidades: detectar entrecalles, aplicar Qwen, clasificar (conservado/descartado/pendiente), subir a Supabase
- Terminal: 🟦 Celeste = conservado+Qwen, 🟩 Verde = conservado, 🟥 Rojo = descartado, 🟨 Amarillo = pendiente

### Qwen (Datos Municipales)

- 18 registros normativos extraídos del digesto municipal
- 17/18 aplicados a segmentos de Supabase (Av. José Iglesias no tiene segmentos cargados)
- ~110 segmentos con datos municipales en Supabase

## Pendientes

- [ ] Cargar segmentos de Av. José Iglesias desde GeoJSON local a Supabase
- [ ] Versión mobile del editor para clasificar calles desde la calle
- [ ] Tooltips en el mapa con datos del segmento (UX a definir)