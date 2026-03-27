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
- Se actualizó la acción `toggleLayer` para permitir encender/apagar esta capa de forma independiente a los marcadores físicos.

### B. Lógica de Filtrado (Consistencia de Datos)
Para que el mapa de calor sea útil, **comparte la misma lógica de filtrado** que los pines oficiales:
- Si el usuario aplica un filtro de **"Sin base"** en el Sidebar, el array `filteredPoints` se reduce.
- Este array filtrado alimenta simultáneamente a `MarkerClusterGroup` (pines) y a `HeatmapLayer` (calor).
- **Resultado:** El mapa de calor siempre refleja exactamente lo que el usuario está filtrando.

### C. El Componente `HeatmapLayer`
Ubicado en `src/components/ControlMap.tsx`, este componente:
1. Recibe los puntos filtrados.
2. Extrae las coordenadas de la geometría (GeoJSON o WKT).
3. Crea una instancia de `L.heatLayer`.
4. Se encarga de la limpieza (`removeLayer`) cuando el componente se desmonta o los datos cambian.

---

## 3. Configuración Visual (Personalización)

Actualmente, el mapa está configurado con estos parámetros en `ControlMap.tsx`:

```javascript
(L as any).heatLayer(heatPoints, {
  radius: 20,    // Radio de influencia de cada punto (en píxeles)
  blur: 15,      // Cantidad de desenfoque para suavizar las manchas
  maxZoom: 18,   // Zoom al cual la intensidad es máxima
  gradient: {    // Escala de colores (0 a 1)
    0.4: 'blue', 
    0.6: 'cyan', 
    0.7: 'lime', 
    0.8: 'yellow', 
    1: 'red' 
  }
})
```

### ¿Cómo ajustarlo?
- **Intensidad:** Se puede aumentar cambiando el tercer valor en el array de puntos: `[lat, lng, intensidad]`. Actualmente usamos `0.5`.
- **Colores:** Puedes cambiar el objeto `gradient`. Por ejemplo, para un mapa de calor "clásico de urgencia", podrías usar solo naranjas y rojos.

---

## 4. Mejoras Propuestas & Usabilidad (Rama: `feat/heat-maps`)

Estas mejoras se están iterando actualmente en la rama de desarrollo:

### Filtros Simultáneos (Urgencia)
**Pregunta:** *¿Se puede filtrar 'sin base' y 'base deteriorada' simultáneamente?*
- **Respuesta:** Sí. Actualmente el filtro es exclusivo (una opción a la vez). Para lograr esto, debemos modificar `mapFilters.estadoBase` para que acepte un array o crear una categoría lógica de "Urgencia" que incluya ambos estados en la consulta de JavaScript.

### Aislamiento de Vista
**Pregunta:** *¿Se puede mostrar el foco sin la nube de puntos?*
- **Respuesta:** **Ya es posible.** En el menú de capas (`LayerControl`), el usuario puede:
    - Desactivar "Luminarias (Puntos)".
    - Activar "Mapa de Calor".
- Esto dejará el mapa limpio mostrando únicamente las zonas de calor sobre el mapa base.

### Configuración de Gráfica
**Pregunta:** *¿Se puede configurar la intensidad y color?*
- **Respuesta:** Sí. Se podría añadir un panel de "Ajustes de Capa" donde el usuario mueva un *slider* para cambiar el `radius` (radio) en tiempo real, permitiendo ver focos más grandes o más detallados según la necesidad del análisis.

---

## 5. Próximos Pasos sugeridos
1. **Multi-selección en filtros:** Cambiar el dropdown de "Estado de Base" por checkboxes.
2. **Normalización por superficie:** Hacer que el calor sea más intenso no solo por cantidad de puntos, sino por densidad (puntos por metro cuadrado).
3. **Persistencia de preferencia:** Guardar en `localStorage` si el usuario prefiere ver el mapa de calor por defecto.
