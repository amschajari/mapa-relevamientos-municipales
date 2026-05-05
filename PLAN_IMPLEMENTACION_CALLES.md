# Plan de Implementación: Capa de Calles Pavimentadas (GIS)

Este documento detalla el diagnóstico actual del sistema y el plan técnico para integrar la capa de calles pavimentadas utilizando PostGIS y React-Leaflet de forma eficiente.

## 1. Diagnóstico Técnico Actual

### Riesgos Identificados
*   **Carga Masiva (Full Scan):** Actualmente, las capas como `puntos_relevamiento` o `espacios_verdes` se descargan completas (`select *`). Al cargar calles (geometrías lineales densas), esto causará lentitud en el parseo de GeoJSON y consumo excesivo de memoria en el navegador.
*   **Duplicación de Estado:** Existe lógica de visibilidad en `barrioStore` y `mapStore`. Es necesario centralizar en `mapStore` (IDE-Style) para evitar bugs de sincronización en la UI.
*   **Clusterización:** El `MarkerClusterGroup` se destruye y recrea al cambiar filtros debido a su `key` dinámica, lo cual afecta la fluidez de la interfaz.

---

## 2. Flujo de Datos: Limpieza y Preparación (QGIS)

Antes de subir a la DB, se debe limpiar el GeoJSON de Overpass Turbo.

### A. Recorte Espacial (Clip)
1.  Cargar capa de **Calles (LineString)** y capa del **Ejido/Polígono**.
2.  Herramienta: `Vectorial > Herramientas de Geoproceso > Recortar (Clip)`.
    *   **Entrada:** Calles.
    *   **Overlay:** Ejido.
3.  Guardar resultado como `calle_edit.shp` (o directo a GeoJSON).

### B. Normalización de Atributos (CRÍTICO)
Para optimizar el renderizado en React (peso de línea según tipo), debemos separar el tipo de vía del nombre.

1.  **Exportar a GeoJSON:** Formato `calles_pavimentadas_limpias.geojson`, **CRS: EPSG:4326**.
2.  **Crear campo `tipo`:** Usar Calculadora de Campos en QGIS.

