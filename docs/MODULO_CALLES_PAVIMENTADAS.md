# MÓDULO CALLES PAVIMENTADAS - CHAJARÍ

> **Estado:** ✅ Fase 1 completada - Fase 2 en desarrollo - Fase 3 (Integración Supabase) planificada  
> **Última actualización:** Abril 2026  
> **Propósito:** Sistema de gestión de calles pavimentadas con visualización en mapa, editor de clasificación por tramos y herramientas de segmentación
> **Rama activa:** `feature/ui-ide-sidebar`

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

## 6. FASE 3: INTEGRACIÓN CON SUPABASE (EN DESARROLLO)

### 6.1 Contexto y Objetivo

**Situación actual:**
- Supabase tiene 875 segmentos cargados (datos iniciales)
- El editor HTML trabaja con 2422 segmentos segmentados (GeoJSON local en `docs/calles_segmentadas.geojson`)
- Se estima que ~70% se descartará, conservando solo calles realmente pavimentadas (~30%)

**Objetivo:** Integrar el editor HTML con Supabase para:
1. Clasificación en tiempo real (estado: `pendiente` → `conservado` / `descartado`)
2. Importar segmentos nuevos que faltan (desde GeoJSON de QGIS)
3. Sincronizar cambios con otras interfaces (mapa React en la app principal)

### 6.2 Cambios en la Base de Datos

**Nueva columna requerida:**
```sql
-- Agregar columna estado
ALTER TABLE calles_pavimentadas 
ADD COLUMN estado TEXT DEFAULT 'pendiente';
-- Valores: 'pendiente', 'conservado', 'descartado'

-- Agregar columnas de atributos (opcional)
ALTER TABLE calles_pavimentadas
ADD COLUMN tipo_obra TEXT,
ADD COLUMN entre_calle_1 TEXT,
ADD COLUMN entre_calle_2 TEXT,
ADD COLUMN fecha_aprobacion_concejo DATE,
ADD COLUMN fecha_inauguracion DATE,
ADD COLUMN observaciones TEXT;
```

### 6.3 Workflow de Integración

```
┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  QGIS (opcional) │────▶│  Editor HTML    │────▶│   Supabase      │
│  Importar nuevos │     │  Clasificar +   │     │   Persistencia  │
│  segmentos       │     │  Atributos      │     │   centralizada  │
└──────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  App React      │
                                              │  (mapa principal│
                                              │   con polling)  │
                                              └─────────────────┘
```

### 6.4 Funcionalidades del Editor HTML (v2.1 - Con Supabase)

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| Carga inicial | Lee desde `calles_segmentadas.geojson` local | ✅ Implementado |
| Importar segmentos | Fusiona GeoJSON externo (QGIS) con fid nuevos | 📝 Pendiente |
| Clasificación | Cambiar estado (conservado/descartado/pendiente) | ✅ Local |
| Guardar en Supabase | Upsert: inserta nuevos, actualiza existentes | 📝 Pendiente |
| Atributos | Editar tipo_obra, entre_calles, fechas, obs | ✅ Local |
| Exportar | Descarga GeoJSON con solo conservados | ✅ Implementado |

### 6.5 Variables de Entorno

El editor necesita las mismas credenciales que la app React:

```env
VITE_SUPABASE_URL=https://elczfqaevdnomwflgvka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota:** El editor HTML es standalone (no usa Vite), así que las credenciales se embeberán directamente en el HTML o se cargarán desde un archivo `.env` separado.

### 6.6 Consideraciones Técnicas

1. **Identificación de segmentos:**
   - `fid` es la clave única (BIGINT UNIQUE en Supabase)
   - Nuevos segmentos desde QGIS deben tener fid incremental

2. **Sincronización:**
   - El editor HTML guarda cambios vía REST API de Supabase
   - La app React puede usar polling (cada 30s) o Realtime subscriptions

3. **Permisos:**
   - RLS requiere usuario autenticado con email `a.m.saposnik@gmail.com`
   - Para desarrollo, se puede deshabilitar RLS temporalmente

### 6.7 Pasos para Continuar el Desarrollo

1. **Base de datos:** Ejecutar SQL para agregar columnas `estado` y atributos
2. **Editor HTML:** 
   - Agregar conexión a Supabase (CDN script)
   - Modificar `guardarProgreso()` para upsert a Supabase
   - Agregar botón "Importar segmentos adicionales"
3. **App React:** 
   - Agregar polling a `PavimentoLayer.tsx` o usar Supabase Realtime
4. **Testing:** Verificar que cambios en editor se reflejen en el mapa

---

## 7. EDITOR DE CLASIFICACIÓN AVANZADA (v2)

---

## 7. EDITOR DE CLASIFICACIÓN AVANZADA (v2)

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

## 8. FUENTE DE DATOS OFICIAL

| Fuente | URL | Datos a Extraer |
|--------|-----|-----------------|
| Digesto Municipal | https://digesto.chajari.gob.ar/normas | Ordenanzas de pavimentación por sector/año |

> **Nota:** Se debe estudiar el digesto para identificar ordenanzas relacionadas con obras de pavimentación históricas y planificadas.

---

## 9. WORKFLOW PROPUESTO

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

## 10. ESQUEMA DE DATOS (PROPUESTO - PENDIENTE CONFIRMACIÓN)

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

## 11. CONSULTA OVERPASS TURBO

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

## 12. TAREAS PENDIENTES

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

## 13. NOTAS TÉCNICAS

| Aspecto | Valor | Notas |
|---------|-------|-------|
| Sistema de Referencia | WGS84 (EPSG:4326) | Compatible con Leaflet/Mapbox |
| Formato de intercambio | GeoJSON | Estándar para web GIS |
| Formato QGIS | Shapefile o Geopackage | Para edición local |
| Sistema de coordenadas proyecto | WGS84 | Consistente con barrios existentes |

---

## 14. RECURSOS ADICIONALES

### Documentación relacionada
- `PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md` - Roadmap general del sistema
- `ROADMAP.md` - Fases de desarrollo
- `CLAUDE.md` - Configuración técnica del proyecto

### Herramientas sugeridas
- **QGIS** - Edición vectorial y análisis espacial
- **Overpass Turbo** - Descarga de datos OSM
- **QuickOSM (plugin QGIS)** - Descarga directa desde QGIS

---

## 15. HISTORIAL DE CAMBIOS

| Fecha | Autor | Cambio |
|-------|-------|--------|
| Abril 2026 | - | Creación del documento (borrador inicial) |
| Abril 2026 | - | Corrección del bounding box en query Overpass (coordenadas basadas en barrios reales de Chajarí) |

---

> **Nota para el equipo:** Este documento es un borrador vivo. Se espera iterar y refinar según se obtenga más información del digesto municipal y de los responsables del área de obras.
