# Informe de Auditoría Técnica: Funcionalidad Heat Maps (feat/heat-maps) 📊🔥

## 1. Observaciones Técnicas

### 🛠️ Eficiencia de la Lógica `isFiltered`
La implementación actual en `ControlMap.tsx` utiliza un `useMemo` para filtrar los puntos, lo cual es correcto. Sin embargo, la lógica de `isFiltered` pasada al `HeatmapLayer` es binaria:
```typescript
isFiltered={mapFilters.estadosBase && mapFilters.estadosBase.length > 0}
```
**Problema:** Si el usuario selecciona **todos** los estados (ej. "Ok" + "Malas" + "Sin Base"), la densidad de puntos es máxima, pero `isFiltered` sigue siendo `true`. Esto resulta en una intensidad de `0.9` sobre una población completa, lo que satura el mapa ("quema" la visualización) innecesariamente.

### ⚡ Rendimiento y Ciclo de Vida (Memory Leaks)
- **Gestión de Capas:** El uso de `map.removeLayer(heatLayer)` en el cleanup del `useEffect` es correcto para prevenir memory leaks básicos.
- **Cuello de Botella:** El componente recrea la capa completa cada vez que `points` o `isFiltered` cambian. Para +5000 puntos, esto implica un mapeo costoso de coordenadas y una reinicialización del motor de renderizado de Leaflet.
- **Optimización Perdida:** El plugin `leaflet.heat` soporta `setLatLngs()`, que permitiría actualizar los puntos sin destruir/crear la capa.

---

## 2. Riesgos Identificados ⚠️

### A. Saturación Visual (Edge Case: Selección Total)
Como se mencionó, seleccionar todos los filtros activa la compensación de intensidad máxima. En un barrio con alta densidad de luminarias, el mapa se volverá un bloque rojo sólido, perdiendo su utilidad analítica.

### B. Degradación de FPS con Alta Densidad
Aunque Leaflet.heat es eficiente, la transformación de `point.geom` (WKT o GeoJSON) a `[lat, lng, intensity]` ocurre en el hilo principal dentro del efecto. Con 5000+ puntos reales, el cambio de un filtro en la Sidebar podría causar un "freeze" perceptible de ~200ms.

### C. Consistencia de Datos en Multi-selección
La lógica de filtrado manual en `OfficialPointsLayer` (líneas 135-147) depende de comparaciones de strings (`includes('sin base')`). Si los datos de Supabase cambian ligeramente su nomenclatura, el mapa de calor dejará de ser consistente con los marcadores.

---

## 3. Validación de Usabilidad

- **Transición de Intensidad:** El salto entre `0.4` y `0.9` es muy brusco. El usuario percibe un cambio drástico en el "clima" del mapa al tocar un solo checkbox.
- **Intuición:** La multi-selección en la Sidebar es excelente y clara. Sin embargo, no hay feedback visual de que el mapa está "compensando" la intensidad; el usuario podría pensar que "todas las zonas son críticas" cuando solo hay pocos puntos.

---

## 4. Propuestas de Iteración 🚀

### A. Normalización por Superficie (Matemática Sugerida)
En lugar de una intensidad estática, podemos usar la superficie del barrio (si hay uno seleccionado):
```typescript
// En HeatmapLayer
const density = points.length / (barrioSuperficie || 1);
const intensity = Math.min(0.9, Math.max(0.4, density * factorK));
```
Esto permitiría que un barrio pequeño con 10 fallas se vea tan "caliente" como un barrio enorme con 100 fallas.

### B. Controles Manuales (Sliders)
Para no sobrecargar la UI principal, sugiero añadir un **"Panel de Ajuste Fino"** colapsable dentro de la sección de "Mapa de Calor" en la Sidebar:
- **Slider de Radio:** (10px a 50px) para ajustar la dispersión.
- **Slider de Intensidad:** (0.1 a 1.0) para "limpiar" el ruido.

### C. Refactor de Rendimiento
Optimizar `HeatmapLayer` usando una `ref` para la capa:
```typescript
const heatLayerRef = useRef<any>(null);

useEffect(() => {
  if (!heatLayerRef.current) {
    heatLayerRef.current = L.heatLayer([], options).addTo(map);
  }
  heatLayerRef.current.setLatLngs(heatPoints);
  heatLayerRef.current.setOptions({ radius: dynamicRadius });
}, [heatPoints, dynamicRadius]);
```

### D. Mejora de logic de Compensación
Cambiar `isFiltered` por un `ratio`:
```typescript
const ratio = points.length / totalPoints;
const intensity = ratio < 0.3 ? 0.9 : 0.4; // Solo compensar si vemos menos del 30% de los datos
```
