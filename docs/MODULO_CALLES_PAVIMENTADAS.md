# MÓDULO CALLES PAVIMENTADAS - CHAJARÍ

> **Estado:** Borrador inicial  
> **Última actualización:** Abril 2026  
> **Propósito:** Sistema de gestión de calles pavimentadas con historial por etapas y ordenanzas

---

## 1. OBJETIVO

Sistema de gestión espacial para el seguimiento de calles pavimentadas en la Municipalidad de Chajarí, permitiendo categorizar sectores por época de pavimentación y vincular con la normativa municipal (ordenanzas).

---

## 2. FUENTE DE DATOS OFICIAL

| Fuente | URL | Datos a Extraer |
|--------|-----|-----------------|
| Digesto Municipal | https://digesto.chajari.gob.ar/normas | Ordenanzas de pavimentación por sector/año |

> **Nota:** Se debe estudiar el digesto para identificar ordenanzas relacionadas con obras de pavimentación históricas y planificadas.

---

## 3. WORKFLOW PROPUESTO

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Descargar     │────▶│    Editar en    │────▶│   Importar al   │
│   OSM (calles)  │     │      QGIS       │     │     Sistema     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                         │                       │
       ▼                         ▼                       ▼
  Overpass Turbo           Agregar campos         GeoJSON +
  QGIS QuickOSM            personalizados         metadatos
```

---

## 4. ESQUEMA DE DATOS (PROPUESTO - PENDIENTE CONFIRMACIÓN)

| Campo | Tipo | Descripción | Estado |
|-------|------|-------------|--------|
| `nombre_calle` | string | Nombre de la calle | ✅ Requerido |
| `geometry` | geojson (LineString) | Trazado vectorial de la calle | ✅ Requerido |
| `anio_pavimentacion` | integer | Año en que se realizó la obra | 📝 A confirmar |
| `ordenanza` | string | Número y/o referencia de ordenanza | 📝 A confirmar |
| `etapa` | string | Etapa de pavimentación (definición pendiente) | 📝 Abierto |
| `material` | enum | Tipo: 'asfalto', 'hormigon' | ✅ Confirmado |
| `estado_actual` | enum | 'bueno', 'regular', 'malo' | 📝 A confirmar |
| `sector` | string | Barrio o sector geográfico | 📝 A confirmar |
| `observaciones` | text | Notas adicionales | ✅ Opcional |
| `longitud_m` | float | Longitud en metros (calculado) | ✅ Automático |

> **Notas:**
> - Material excluido: `adoquín` (por ahora)
> - Campo `etapa`: definición pendiente según criterio municipal

---

## 5. CONSULTA OVERPASS TURBO

Query lista para copiar y pegar en [Overpass Turbo](https://overpass-turbo.eu/):

```overpass
[out:json][timeout:25];
// Bounding box de Chajarí (basado en polígonos de barrios municipales)
// Coordenadas: (lat_min, lon_min, lat_max, lon_max)
(
  // Calles residenciales
  way["highway"="residential"](-30.780,-58.030,-30.730,-57.965);
  // Avenidas y colectoras
  way["highway"="primary"](-30.780,-58.030,-30.730,-57.965);
  way["highway"="secondary"](-30.780,-58.030,-30.730,-57.965);
  way["highway"="tertiary"](-30.780,-58.030,-30.730,-57.965);
  // Calles de servicio y accesos
  way["highway"="service"](-30.780,-58.030,-30.730,-57.965);
  
  // Opcional: filtrar solo pavimentadas (si existen etiquetas surface)
  // ATENCIÓN: En OSM no todas las calles tienen etiqueta surface
  // way["highway"]["surface"~"paved|asphalt|concrete"](-30.780,-58.030,-30.730,-57.965);
);

// Salida de datos con geometría completa
out body;
>;
out skel qt;
```

### Instrucciones de uso:

1. Ir a https://overpass-turbo.eu/
2. Pegar la consulta arriba
3. Hacer clic en "Ejecutar" ▶️ o presionar `Ctrl+Enter`
4. Verificar que el área cubra todo Chajarí (aparecerá el recuadro violeta en el mapa)
5. Exportar como GeoJSON: "Exportar" → "GeoJSON" → "Descargar"

### Notas sobre la consulta:

- **Bounding box corregido**: `(-30.780, -58.030, -30.730, -57.965)` basado en los polígonos reales de barrios
- **Si no aparecen resultados**: Probar con un área más amplia cambiando los valores
- **La etiqueta `surface`**: Muy pocas calles en OSM la tienen completa en Chajarí. Mejor descargar todo y filtrar en QGIS.
- **Tipos de vía incluidos**: residential, primary, secondary, tertiary, service (cubre la mayoría de calles urbanas)

---

## 6. TAREAS PENDIENTES

### Fase 1: Investigación
- [ ] Estudiar https://digesto.chajari.gob.ar/normas
- [ ] Identificar ordenanzas de pavimentación históricas
- [ ] Reunir datos de obras del área correspondiente
- [ ] Confirmar esquema de datos con responsables

### Fase 2: Preparación de Datos
- [ ] Descargar capa completa de calles de OSM (Chajarí)
- [ ] Abrir en QGIS y explorar atributos
- [ ] Definir sectores/barrios para categorización
- [ ] Crear campos personalizados según esquema

### Fase 3: Carga al Sistema
- [ ] Exportar desde QGIS a GeoJSON
- [ ] Validar geometrías y atributos
- [ ] Importar al sistema GIS municipal
- [ ] Verificar visualización y funcionalidad

---

## 7. NOTAS TÉCNICAS

| Aspecto | Valor | Notas |
|---------|-------|-------|
| Sistema de Referencia | WGS84 (EPSG:4326) | Compatible con Leaflet/Mapbox |
| Formato de intercambio | GeoJSON | Estándar para web GIS |
| Formato QGIS | Shapefile o Geopackage | Para edición local |
| Sistema de coordenadas proyecto | WGS84 | Consistente con barrios existentes |

---

## 8. RECURSOS ADICIONALES

### Documentación relacionada
- `PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md` - Roadmap general del sistema
- `ROADMAP.md` - Fases de desarrollo
- `CLAUDE.md` - Configuración técnica del proyecto

### Herramientas sugeridas
- **QGIS** - Edición vectorial y análisis espacial
- **Overpass Turbo** - Descarga de datos OSM
- **QuickOSM (plugin QGIS)** - Descarga directa desde QGIS

---

## 9. HISTORIAL DE CAMBIOS

| Fecha | Autor | Cambio |
|-------|-------|--------|
| Abril 2026 | - | Creación del documento (borrador inicial) |
| Abril 2026 | - | Corrección del bounding box en query Overpass (coordenadas basadas en barrios reales de Chajarí) |

---

> **Nota para el equipo:** Este documento es un borrador vivo. Se espera iterar y refinar según se obtenga más información del digesto municipal y de los responsables del área de obras.
