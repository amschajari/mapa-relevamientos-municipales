# Implementación de Mapas de Calor (Heat Maps) 📊🔥

> **Estado:** ✅ Refactor de Rendimiento Completado (Rama `feat/heat-maps`)
> **Última actualización:** 2026-03-27

Este documento detalla la lógica, dependencias y configuración utilizada para implementar la funcionalidad de Mapas de Calor en el proyecto **Mapa de Relevamientos Municipales**.

## 1. Dependencias Instaladas

Se utiliza la biblioteca **`leaflet.heat`**, un plugin ligero y eficiente para Leaflet que permite renderizar miles de puntos como una superficie de intensidad continua.

- **Instalación:** `npm install leaflet.heat`
- **Tipos:** Se maneja mediante casting a `(L as any)` debido a que es un plugin clásico de Leaflet sin tipos nativos en el ecosistema moderno de React-Leaflet, pero totalmente compatible.

## 2. Arquitectura de la Solución (Refactorizada) ⚡

### A. Estado Global (Zustand)
En `src/stores/barrioStore.ts`:
- Se añadió la propiedad `heatmap` al objeto `visibleLayers`.
- Se migró `mapFilters.estadoBase` (string) a `mapFilters.estadosBase` (string[]) para soportar la multi-selección.

### B. Lógica de Filtrado (Consistencia de Datos)
Para que el mapa de calor sea útil, **comparte la misma lógica de filtrado** que los pines oficiales:
- El usuario puede seleccionar múltiples estados simultáneamente (ej. "Sin base" + "Deteriorada").
- El mapa de calor siempre refleja exactamente lo que el usuario está filtrando en la Sidebar o en los controles móviles.

### C. El Componente `HeatmapLayer` (Alto Rendimiento) 🚀
Ubicado en `src/components/ControlMap.tsx`, este componente ha sido refactorizado siguiendo las mejores prácticas de GIS:
1. **Instancia Persistente con `useRef`:** No se destruye la capa al filtrar; se usan `setLatLngs()` y `setOptions()` para actualizaciones ultra-fluidas.
2. **Inteligencia de Capa (Ratio de Densidad):** La intensidad y el radio se ajustan automáticamente según el ratio de puntos visibles vs. totales.
   - **Pocos puntos:** Mayor intensidad (0.9) y radio (30px).
   - **Muchos puntos:** Menor intensidad (0.4) y radio (22px).
3. **Validación de Coordenadas:** Parseo seguro que ignora geometrías corruptas o nulas, evitando "puntos fantasma".
4. **Threshold de Seguridad:** Desactivación automática por encima de 5000 puntos para garantizar fluidez en móviles.

---

## 3. Configuración Visual (Personalización)

### Estética de Urgencia
El mapa utiliza un gradiente de tonos cálidos para resaltar zonas críticas:
- **Amarillo (`#fde047`)** -> **Naranja (`#f97316`)** -> **Rojo (`#ef4444`)** -> **Rojo Sangre (`#991b1b`)**.

---

## 4. Mejoras Implementadas ✅ (Rama: `feat/heat-maps`)

### Filtros Simultáneos (Urgencia) 🚀
- **Logro:** Soporte para multi-selección de estados en Desktop y Móvil.

### Aislamiento de Vista 🚀
- **Logro:** Independencia total entre la capa de puntos y la de calor.

### Rendimiento Production-Ready 🚀
- **Logro:** Eliminación de "freezes" durante el filtrado y visualización optimizada.

---

## 5. Próximos Pasos sugeridos
1. **Normalización por superficie:** Ajustar la intensidad según el área del barrio seleccionado.
2. **Control de Intensidad:** Añadir un slider para que el usuario ajuste el `radius` en tiempo real.
3. **Persistencia:** Guardar la visibilidad de la capa en el Store persistente.
