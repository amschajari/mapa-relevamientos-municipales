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
// Bounding box aproximado de Chajarí
// Ajustar según necesidad
(
  // Calles residenciales
  way["highway"="residential"](-30.8873,-57.9894,-30.8533,-57.9394);
  // Avenidas principales
  way["highway"="primary"](-30.8873,-57.9894,-30.8533,-57.9394);
  way["highway"="secondary"](-30.8873,-57.9894,-30.8533,-57.9394);
  way["highway"="tertiary"](-30.8873,-57.9894,-30.8533,-57.9394);
  
  // Opcional: filtrar solo pavimentadas (si existen etiquetas surface)
  // way["highway"]["surface"~"paved|asphalt|concrete"](-30.8873,-57.9894,-30.8533,-57.9394);
);

// Salida de datos
out body;
>;
out skel qt;
```

### Instrucciones de uso:

1. Ir a https://overpass-turbo.eu/
2. Pegar la consulta arriba
3. Hacer clic en "Ejecutar" ▶️
4. Verificar que el bbox cubra todo Chajarí (ajustar coordenadas si es necesario)
5. Exportar como GeoJSON: "Exportar" → "GeoJSON"

### Notas sobre la consulta:

- El bbox `(-30.8873,-57.9894,-30.8533,-57.9394)` es aproximado. **Verificar/aumentar** según extensión real del ejido urbano.
- La línea comentada con `surface` puede descomentarse si se quiere filtrar solo pavimentadas, pero atención: no todas las calles en OSM tienen esa etiqueta completa.

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

---

> **Nota para el equipo:** Este documento es un borrador vivo. Se espera iterar y refinar según se obtenga más información del digesto municipal y de los responsables del área de obras.
