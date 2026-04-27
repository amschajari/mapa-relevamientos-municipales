# MÓDULO CALLES PAVIMENTADAS - CHAJARÍ

> **Estado:** ✅ Fase 1 completada - Fase 2 en desarrollo  
> **Última actualización:** Abril 2026  
> **Propósito:** Sistema de gestión de calles pavimentadas con visualización en mapa, editor de clasificación por tramos y herramientas de segmentación

---

## 1. OBJETIVO

Sistema de gestión espacial para visualización de calles pavimentadas en la Municipalidad de Chajarí.

---

## 2. DATOS CARGADOS

| Campo | Origen | Cantidad |
|-------|--------|-----------|
| fid | GeoJSON | 875 |
| nombre | GeoJSON | 875 |
| geom | GeoJSON (MultiLineString) | 875 |
| longitud_m | @turf/length | 875 |

---

## 3. ARQUITECTURA IMPLEMENTADA

### Tabla Supabase
```sql
CREATE TABLE calles_pavimentadas (
  id UUID PRIMARY KEY,
  fid BIGINT UNIQUE,
  nombre TEXT,
  geom Geometry(MultiLineString, 4326),
  longitud_m DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Políticas RLS (複製 desde barrios)
CREATE POLICY "Lectura publica en calles_pavimentadas" ON calles_pavimentadas
  FOR SELECT TO public USING (true);

CREATE POLICY "Escritura admin en calles_pavimentadas" ON calles_pavimentadas
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'a.m.saposnik@gmail.com')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'a.m.saposnik@gmail.com')
  );

ALTER TABLE calles_pavimentadas ENABLE ROW LEVEL SECURITY;
```

### Componentes
- `ImportadorCallesPavimentadas.tsx` - Importador desde GeoJSON
- `PavimentoLayer.tsx` - Renderizado en Leaflet
- Capas: Calles (gris), Avenidas (oscuro, más grueso)

### Ubicación de datos
- GeoJSON fuente: `src/data/calles_ejido_reordenado.geojson`
- Importado a Supabase: 875 segmentos

---

## 4. USO

### 4.1 Visualización básica
1. **Importar**: Importación > Calles Pavimentadas >_arrastrar GeoJSON > Importar
2. **Visualizar**: Capas > Calles Pavimentadas > Activar Calles o Avenidas

### 4.2 Editor avanzado de clasificación (v2)
Para clasificación detallada por tramos y edición de atributos:
1. Abrir el editor: http://localhost:8000/editor_calles_pavimentadas_v2.html
2. Carga automática del GeoJSON segmentado (2422 tramos)
3. Herramientas disponibles:
   - **Selección**: Click individual, Shift+click (rango), Ctrl+click (múltiple), Box selection (arrastrar)
   - **Clasificación**: 
     - ✓ Conservar (verde) = tramo pavimentado
     - ✗ Descartar (rojo) = tramo no pavimentado
     - Doble click para cambiar estado
   - **Herramienta de corte** (✂️): Dividir tramos en puntos específicos
   - **Panel de atributos**: Al seleccionar tramo(s):
     - Tipo obra: Hormigón / Pavimento asfáltico
     - Entre calle 1/2: Detectado automáticamente por intersección
     - Fechas de aprobación e inauguración
     - Observaciones libres
   - **Export**: Solo segmentos conservados listo para Supabase

---

## 5. TAREAS PENDIENTES

- [ ] Agregar atributos adicionales (año, ordenanza, etc.)
- [ ] Vincular con barrios
- [ ] Mejoras de edición en el editor v2

---

## 6. EDITOR DE CLASIFICACIÓN AVANZADA (v2)

### 6.1 Archivos generados

| Archivo | Descripción | Cantidad |
|---------|------------|----------|
| `calles_segmentadas.geojson` | GeoJSON segmentado (tramos entre intersecciones) | 2422 features |
| `editor_calles_pavimentadas_v2.html` | Editor web interactivo | - |

### 6.2 Cómo usar el editor

**Paso 1: Iniciar servidor HTTP local**
```bash
cd docs
python -m http.server 8000
```
Luego abrir en navegador: http://localhost:8000/editor_calles_pavimentadas_v2.html

**Paso 2: Herramientas de selección**

| Acción | Cómo acceder |
|--------|-------------|
| Seleccionar uno | Click en el segmento |
| Seleccionar rango | Shift + click |
| Agregar/quitar de selección | Ctrl + click |
| Seleccionar todos | Ctrl + A |
| Box selection | Click en herramienta ⬜ y arrastrar |

**Paso 3: Clasificar segmentos**

| Estado | Color | Significado |
|--------|-------|-------------|
| Pendiente | Amarillo | Sin clasificar |
| ✓ Conservar | Verde | Pavimentado (se exporta) |
| ✗ Descartar | Rojo | No pavimentado (se excluye) |

- Para clasificar: seleccionar segmentos → click en botón ✓ o ✗
- Doble click en segmento: cicla estado

**Paso 4: Completar atributos**
Al seleccionar segmentos, el panel lateral permite editar:
- Tipo de obra (Hormigón / Pavimento asfáltico)
- Entre calle 1 (se detecta automáticamente)
- Entre calle 2 (se detecta automáticamente)
- Fecha aprobación Concejal
- Fecha inauguración
- Observaciones

**Paso 5: Exportar**
Click en "Exportar GeoJSON" → descarga archivo con solo los segmentos "Conservar".

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
