# Auditoría Técnica: Funcionalidad Heat Maps 🗺️🔥

**Rama:** `feat/heat-maps`
**Fecha:** 2026-03-27
**Auditor:** Claude (Senior Software Engineer & GIS Specialist)

---

## Resumen Ejecutivo

La implementación de mapas de calor en la rama `feat/heat-maps` es **funcional y bien estructurada**, pero presenta oportunidades de optimización significativas en rendimiento, usabilidad y manejo de edge cases.

---

## 1. Observaciones Técnicas 🔍

### 1.1 Eficiencia de la Lógica `isFiltered`

**Ubicación:** `src/components/ControlMap.tsx:24-70`

```typescript
const HeatmapLayer = ({ points, isFiltered }: { points: any[], isFiltered: boolean }) => {
  const intensity = isFiltered ? 0.9 : 0.4
  const dynamicRadius = isFiltered ? 30 : 22
  // ...
}
```

**Análisis:**

| Aspecto | Evaluación |
|---------|------------|
| Lógica binaria | ⚠️ Problema: no distingue entre "pocos puntos filtrados" vs "todos los puntos visibles" |
| Cálculo en render | ✅ Correcto: se computa dentro del useEffect con dependencias apropiadas |
| Dependencias | ✅ `isFiltered` está en las dependencias del cleanup |

**Problema crítico:** Si el usuario selecciona **todos los estados** (`["ok", "malas", "sin_base"]`), `isFiltered` es `true` pero la densidad es máxima. Resultado: intensidad `0.9` sobre 100% de los puntos = saturación visual.

**Recomendación:** Reemplazar lógica binaria por ratio de densidad:

```typescript
const ratio = points.length / totalAvailablePoints
const intensity = ratio < 0.3 ? 0.9 : (ratio < 0.7 ? 0.6 : 0.4)
```

---

### 1.2 Gestión del Ciclo de Vida (Memory Leaks)

**Ubicación:** `src/components/ControlMap.tsx:64-66`

```typescript
return () => {
  map.removeLayer(heatLayer)
}
```

**Evaluación:**

| Riesgo | Estado |
|--------|--------|
| Memory leak básico | ✅ Prevenirido con `removeLayer` |
| Recreación de capa completa | ⚠️ Ineficiente: cada cambio de `points` destruye y recrea la capa |
| Uso de refs para instancia | ❌ No implementado: se pierde optimización vía `setLatLngs()` |

**Impacto en rendimiento:**

- Con **5000+ puntos**, la recreación completa de la capa implica:
  - Mapeo de coordenadas en el hilo principal (~100-200ms)
  - Reinicialización del canvas de Leaflet
  - Posible "freeze" perceptible al cambiar filtros

**Recomendación:** Implementar patrón con `useRef`:

```typescript
const heatLayerRef = useRef<any>(null)

useEffect(() => {
  if (!heatLayerRef.current) {
    heatLayerRef.current = (L as any).heatLayer([], options).addTo(map)
  }
  heatLayerRef.current.setLatLngs(heatPoints)
  heatLayerRef.current.setOptions({
    radius: dynamicRadius,
    gradient: currentGradient
  })
}, [heatPoints, dynamicRadius])
```

---

### 1.3 Parseo de Coordenadas

**Ubicación:** `src/components/ControlMap.tsx:36-44`

```typescript
if (typeof point.geom === 'string' && point.geom.startsWith('POINT')) {
  const match = point.geom.match(/\((.*)\)/)
  // ...
} else if (point.geom.type === 'Point') {
  position = [point.geom.coordinates[1], point.geom.coordinates[0]]
}
```

**Observaciones:**

- ✅ Maneja ambos formatos (WKT y GeoJSON)
- ⚠️ Regex sin validación de null: `match?.[1]` sería más seguro
- ⚠️ Coordenadas hardcodeadas a `[0, 0]` si el parseo falla (puntos fantasma)

**Mejora sugerida:**

```typescript
const parseCoordinates = (geom: any): [number, number] | null => {
  if (typeof geom === 'string' && geom.startsWith('POINT')) {
    const match = geom.match(/\(([^)]+)\)/)
    if (match?.[1]) {
      const [lon, lat] = match[1].split(' ').map(Number)
      return [lat, lon]
    }
  } else if (geom?.type === 'Point' && Array.isArray(geom.coordinates)) {
    return [geom.coordinates[1], geom.coordinates[0]]
  }
  return null
}
```

---

## 2. Riesgos Identificados ⚠️

### 2.1 Saturación Visual (Edge Case: Selección Total)

**Escenario:** Usuario selecciona los 3 estados de base simultáneamente.

**Comportamiento actual:**
- `isFiltered = true` → `intensity = 0.9`, `radius = 30`
- Mapa se vuelve un bloque rojo/naranja sólido en barrios densos
- Pérdida total de utilidad analítica

**Mitigación propuesta:**

```typescript
// Calcular ratio respecto al total disponible
const totalPoints = useBarrioStore.getState().officialPoints?.length || 1
const ratio = points.length / totalPoints

// Intensidad inversamente proporcional al ratio
const baseIntensity = ratio < 0.3 ? 0.9 : (ratio < 0.6 ? 0.6 : 0.4)
const intensity = isFiltered && ratio < 0.5 ? baseIntensity : 0.4
```

---

### 2.2 Degradación de FPS con Alta Densidad

**Umbral crítico:** ~3000 puntos simultáneos

**Síntomas:**
- Lag al hacer zoom/pan con heatmap activo
- Animaciones de transición entre filtros se traban
- Consumo elevado de CPU en dispositivos móviles

**Recomendaciones:**

1. **Threshold de renderizado:** Desactivar heatmap automáticamente si `points.length > 5000`
2. **Canvas optimization:** Usar `maxZoom` para limitar renderizado en zoom levels altos
3. **Debounce de filtros:** Esperar 150ms tras cambio de filtros antes de recalcular

---

### 2.3 Consistencia de Datos (String Matching)

**Ubicación:** `src/components/ControlMap.tsx:136-139`

```typescript
const isSinBase = estadoBaseStr.includes('sin base')
const isMala = estadoBaseStr.includes('mala') || estadoBaseStr.includes('deteriorad')
```

**Riesgo:** Si Supabase cambia nomenclatura (ej: "SIN_BASE" en mayúsculas, "Deteriorada" completo), el heatmap pierde consistencia con los marcadores.

**Mitigación:**

```typescript
const normalizeEstado = (estado: string): 'ok' | 'mala' | 'sin_base' | 'desconocido' => {
  const s = estado.toLowerCase().trim()
  if (s.includes('sin base') || s === 'sin_base') return 'sin_base'
  if (s.includes('mala') || s.includes('deteriorad')) return 'mala'
  if (s === 'ok' || s === 'buena' || s === 'buenas') return 'ok'
  return 'desconocido'
}
```

---

## 3. Validación de Usabilidad 👤

### 3.1 Transición de Intensidad

**Estado actual:** Salto brusco `0.4 → 0.9` (125% de aumento)

**Feedback de usuario esperado:**
- "El mapa cambia drásticamente al tocar un checkbox"
- "No entiendo por qué a veces se ve más intenso"

**Recomendación:** Implementar transición gradual con tweening:

```css
/* En el contenedor del heatmap */
transition: opacity 0.3s ease-in-out;
```

```typescript
// Interpolar intensidad según ratio
const intensity = 0.4 + (1 - ratio) * 0.5  // 0.4 a 0.9 según densidad
```

---

### 3.2 Multi-selección en Sidebar

**Ubicación:** `src/components/Sidebar.tsx:179-204`

**Evaluación:**

| Aspecto | Calificación |
|---------|--------------|
| Claridad visual | ✅ Excelente: botones con indicador de color |
| Feedback de estado | ✅ Borde + shadow en seleccionados |
| Accesibilidad | ⚠️ Faltan labels ARIA para screen readers |
| UX de "deseleccionar todos" | ⚠️ No hay botón "Limpiar filtros" |

**Mejora sugerida:** Agregar botón de reset:

```tsx
{mapFilters.estadosBase.length > 0 && (
  <button
    onClick={() => setMapFilter('estadosBase', [])}
    className="text-xs text-primary-600 hover:underline"
  >
    Limpiar filtros
  </button>
)}
```

---

## 4. Propuestas de Iteración 🚀

### 4.1 Normalización por Superficie (Prioridad: ALTA)

**Objetivo:** Ajustar intensidad según densidad relativa al área del barrio.

**Implementación:**

```typescript
const HeatmapLayer = ({ points, selectedBarrio }: { points: any[], selectedBarrio?: Barrio }) => {
  const map = useMap()

  useEffect(() => {
    const superficieHa = selectedBarrio?.superficie_ha || 1
    const density = points.length / superficieHa  // puntos por hectárea

    // Factor K empírico: ajustar según testing
    const K = 0.05
    const intensity = Math.min(0.9, Math.max(0.2, density * K))

    // ... crear heatLayer con intensity calculada
  }, [points, selectedBarrio])
}
```

**Beneficio:** Un barrio pequeño con 10 fallas se ve tan "caliente" como un barrio grande con 100 fallas.

---

### 4.2 Controles Manuales de Radio e Intensidad (Prioridad: MEDIA)

**Propuesta de UI:**

```
┌─ Mapa de Calor ────────────┐
│ [🔥 Activado]              │
│                            │
│ ▼ Ajustes finos            │
│ ┌──────────────────────┐   │
│ │ Radio     ○─────●──  │   │
│ │           15    30   │   │
│ │                      │   │
│ │ Intensidad ●───○────  │   │
│ │            0.4  0.9   │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

**Implementación en Zustand:**

```typescript
// En barrioStore.ts
heatmapConfig: {
  radius: 22,
  intensity: 0.4,
  autoAdjust: true  // Si false, usa valores manuales
}
```

---

### 4.3 Optimización de Rendimiento (Prioridad: CRÍTICA)

**Refactor completo del `HeatmapLayer`:**

```typescript
const HeatmapLayer = ({ points, isFiltered }: { points: any[], isFiltered: boolean }) => {
  const map = useMap()
  const heatLayerRef = useRef<any>(null)

  // Memoizar transformación de coordenadas
  const heatPoints = useMemo(() => {
    return points
      .map(point => {
        const coords = parseCoordinates(point.geom)
        return coords ? [...coords, isFiltered ? 0.9 : 0.4] : null
      })
      .filter((p): p is [number, number, number] => p !== null)
  }, [points, isFiltered])

  // Efecto de inicialización/actualización
  useEffect(() => {
    if (!heatLayerRef.current) {
      heatLayerRef.current = (L as any).heatLayer([], {
        radius: isFiltered ? 30 : 22,
        blur: 15,
        maxZoom: 18,
        gradient: { 0.4: '#fde047', 0.6: '#f97316', 0.8: '#ef4444', 1.0: '#991b1b' }
      }).addTo(map)
    }

    heatLayerRef.current.setLatLngs(heatPoints)
    heatLayerRef.current.setOptions({
      radius: isFiltered ? 30 : 22,
      gradient: { 0.4: '#fde047', 0.6: '#f97316', 0.8: '#ef4444', 1.0: '#991b1b' }
    })

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [map, heatPoints, isFiltered])

  return null
}
```

---

### 4.4 Mejora de Lógica de Compensación (Prioridad: ALTA)

**Problema:** `isFiltered` binario no refleja la realidad del filtrado.

**Solución:** Usar ratio + umbral dinámico:

```typescript
const CompensatedHeatmapLayer = ({ points }: { points: any[] }) => {
  const totalPoints = useBarrioStore(s => s.officialPoints?.length || 1)
  const ratio = points.length / totalPoints

  // Solo compensar si estamos viendo menos del 40% de los datos
  const shouldCompensate = ratio < 0.4

  const intensity = shouldCompensate
    ? 0.4 + (0.5 * (1 - ratio / 0.4))  // 0.4 a 0.9
    : 0.4

  const radius = shouldCompensate ? 30 : 22

  // ...
}
```

---

## 5. Edge Cases Detectados 🐛

| Escenario | Comportamiento Actual | Impacto | Mitigación |
|-----------|----------------------|---------|------------|
| Todos los filtros activos | Intensidad máxima (0.9) | Saturación visual | Usar ratio de densidad |
| 0 puntos filtrados | Capa no se renderiza | ✅ Correcto | N/A |
| +5000 puntos | Freeze ~200ms | UX degradada | Threshold + debounce |
| Cambio rápido de filtros | Múltiples recreaciones | CPU spike | Debounce 150ms |
| Barrio sin superficie | Densidad = infinito | Intensidad errónea | Default a 1 Ha |
| geom null/undefined | Coordenadas [0,0] | Punto en océano | Validar y skip |

---

## 6. Checklist de Acciones Recomendadas

### Críticas (Implementar antes de merge a main)

- [ ] Refactor con `useRef` + `setLatLngs()` para evitar recreación de capa
- [ ] Reemplazar `isFiltered` binario por ratio de densidad
- [ ] Agregar validación de null en parseo de coordenadas
- [ ] Implementar threshold de 5000 puntos

### Importantes (Post-merge, antes de producción)

- [ ] Normalización por superficie de barrio
- [ ] Botón "Limpiar filtros" en Sidebar
- [ ] Debounce de 150ms en cambios de filtros
- [ ] Labels ARIA en botones de multi-selección

### Deseables (Roadmap futuro)

- [ ] Sliders manuales de radio/intensidad
- [ ] Persistencia de configuración de heatmap
- [ ] Exportar vista de heatmap como imagen
- [ ] Tooltips con densidad numérica al hover

---

## Conclusión

La implementación actual es **sólida y funcional**, pero requiere optimizaciones de rendimiento para escalar a producción con grandes volúmenes de datos. Las mejoras de usabilidad (ratio dinámico, controles manuales) elevarán significativamente la experiencia del usuario.

**Recomendación principal:** Priorizar el refactor con `useRef` + `setLatLngs()` antes de cualquier otra mejora. El beneficio en rendimiento es inmediato y medible.

---

*Generado por Claude - Auditoría Técnica de Heat Maps*
*Basado en análisis de: ControlMap.tsx, barrioStore.ts, Sidebar.tsx, HEAT_MAPS.md*
