# Implementación de Mapas de Calor (Heat Maps) 📊🔥

> **Estado:** 🚧 Desarrollo Activo en rama `feat/heat-maps`
> **Última actualización:** 2026-03-27

Este documento detalla la lógica, dependencias y configuración utilizada para implementar la funcionalidad de Mapas de Calor en el proyecto **Mapa de Relevamientos Municipales**.

## 1. Dependencias Instaladas

Se utiliza la biblioteca **`leaflet.heat`**, un plugin ligero y eficiente para Leaflet que permite renderizar miles de puntos como una superficie de intensidad continua.

- **Instalación:** `npm install leaflet.heat`
- **Tipos:** Se maneja mediante casting a `(L as any)` debido a que es un plugin clásico de Leaflet sin tipos nativos en el ecosistema moderno de React-Leaflet, pero totalmente compatible.

## 2. Arquitectura de la Solución

### A. Estado Global (Zustand)
En `src/stores/barrioStore.ts`:
- Se añadió la propiedad `heatmap` al objeto `visibleLayers`.
- Se migró `mapFilters.estadoBase` (string) a `mapFilters.estadosBase` (string[]) para soportar la multi-selección.

### B. Lógica de Filtrado (Consistencia de Datos)
Para que el mapa de calor sea útil, **comparte la misma lógica de filtrado** que los pines oficiales:
- El usuario puede seleccionar múltiples estados simultáneamente (ej. "Sin base" + "Deteriorada").
- El mapa de calor siempre refleja exactamente lo que el usuario está filtrando en la Sidebar.

### C. El Componente `HeatmapLayer`
Ubicado en `src/components/ControlMap.tsx`, este componente:
1. Recibe los puntos filtrados.
2. Extrae las coordenadas de la geometría.
3. Crea una instancia de `L.heatLayer` con un gradiente cálido profesional.

---

## 3. Configuración Visual (Personalización)

### Estética de Urgencia
El mapa utiliza un gradiente de tonos cálidos para resaltar zonas críticas:
- **Amarillo (`#fde047`)** -> **Naranja (`#f97316`)** -> **Rojo (`#ef4444`)** -> **Rojo Sangre (`#991b1b`)**.

### Inteligencia de Capa (Compensación de Densidad)
Para evitar que el mapa se vea "lavado" al aplicar filtros (cuando hay menos puntos), se implementó una lógica dinámica:
- **Si NO hay filtros:** Radio de 22px e intensidad de 0.4.
- **Si HAY filtros:** Radio de 30px e intensidad de 0.9.
Esto asegura que los focos de problemas siempre sean visibles y definidos, sin importar cuántos puntos se estén visualizando.

---

## 4. Mejoras Implementadas ✅ (Rama: `feat/heat-maps`)

### Filtros Simultáneos (Urgencia) 🚀
- **Logro:** Ahora el usuario puede combinar múltiples estados críticos para ver la acumulación de problemas en una sola vista de calor.
- **UI:** Se implementó una botonera de selección múltiple en la Sidebar.

### Aislamiento de Vista 🚀
- **Logro:** Se puede apagar la capa de "Luminarias (Puntos)" y mantener solo el "Mapa de Calor" para un análisis visual sin distracciones.

### Intensidad Dinámica 🚀
- **Logro:** El mapa detecta automáticamente la densidad de puntos y agudiza la concentración visual cuando se filtran estados críticos.

---

## 5. Próximos Pasos sugeridos
1. **Normalización por superficie:** Ajustar la intensidad según el área del barrio seleccionado.
2. **Control de Intensidad:** Añadir un slider para que el usuario ajuste el `radius` en tiempo real.
3. **Persistencia:** Guardar la visibilidad de la capa en el Store persistente.
