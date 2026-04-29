# Implementación: Integración Editor HTML con Supabase

> **Documento para desarrolladores** - Guía paso a paso para implementar la sincronización entre el editor HTML y Supabase  
> **Rama:** `feature/ui-ide-sidebar`  
> **Fecha:** Abril 2026

---

## 1. Resumen Ejecutivo

### Situación Actual
| Sistema | Datos | Estado |
|---------|-------|--------|
| Supabase | 875 segmentos | Datos iniciales |
| Editor HTML (`docs/editor_calles_pavimentadas_v2.html`) | 2422 segmentos | Clasificación local |
| App React (`src/components/PavimentoLayer.tsx`) | Lee de Supabase | Visualización |

### Objetivo
Integrar el editor HTML con Supabase para:
1. **Clasificación en vivo**: Cambios de estado se guardan directamente en Supabase
2. **Importar segmentos nuevos**: Fusionar GeoJSON desde QGIS con segmentos faltantes
3. **Sincronización**: Otras interfaces ven cambios en tiempo real (polling o Realtime)

---

## 2. Cambios en Base de Datos (Supabase)

### 2.1 Ejecutar en SQL Editor de Supabase

```sql
-- 1. Agregar columna de estado (requerida)
ALTER TABLE calles_pavimentadas 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';

-- 2. Agregar columnas de atributos (opcionales pero recomendadas)
ALTER TABLE calles_pavimentadas
ADD COLUMN IF NOT EXISTS tipo_obra TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_1 TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_2 TEXT,
ADD COLUMN IF NOT EXISTS fecha_aprobacion_concejo DATE,
ADD COLUMN IF NOT EXISTS fecha_inauguracion DATE,
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 3. Índice para consultas por estado (opcional, mejora performance)
CREATE INDEX IF NOT EXISTS idx_calles_estado 
ON calles_pavimentadas(estado);

-- 4. Verificar estructura
\d calles_pavimentadas
```

### 2.2 Verificación

```sql
-- Contar por estado
SELECT estado, COUNT(*) 
FROM calles_pavimentadas 
GROUP BY estado;

-- Verificar columnas nuevas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calles_pavimentadas'
ORDER BY ordinal_position;
```

---

## 3. Modificaciones al Editor HTML

### 3.1 Agregar Supabase desde CDN

Agregar en el `<head>` del editor HTML (después de Leaflet):

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 3.2 Inicializar Cliente Supabase

Agregar al inicio del `<script>` (línea ~189):

```javascript
// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://elczfqaevdnomwflgvka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3.3 Nueva Función: Cargar desde Supabase

Reemplazar/Modificar `loadGeoJSON()` para que intente cargar desde Supabase primero:

```javascript
async function loadGeoJSON(){
  try {
    console.log('Intentando cargar desde Supabase...');
    
    // Intentar cargar desde Supabase
    const { data, error } = await supabase
      .from('calles_pavimentadas')
      .select('*');
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Convertir datos de Supabase a formato del editor
      geojson = { type: 'FeatureCollection', features: [] };
      segments = data.map((row, i) => {
        const feature = {
          type: 'Feature',
          properties: {
            fid: row.fid,
            name: row.nombre,
            estado: row.estado || 'pendiente',
            tipo_obra: row.tipo_obra,
            entre_calle_1: row.entre_calle_1,
            entre_calle_2: row.entre_calle_2,
            fecha_aprobacion_concejo: row.fecha_aprobacion_concejo,
            fecha_inauguracion: row.fecha_inauguracion,
            observaciones: row.observaciones
          },
          geometry: row.geom
        };
        geojson.features.push(feature);
        return {
          id: row.fid || i + 1,
          name: row.nombre || '',
          props: {
            estado: row.estado || 'pendiente',
            tipo_obra: row.tipo_obra,
            entre_calle_1: row.entre_calle_1,
            entre_calle_2: row.entre_calle_2,
            fecha_aprobacion_concejo: row.fecha_aprobacion_concejo,
            fecha_inauguracion: row.fecha_inauguracion,
            observaciones: row.observaciones
          },
          geom: row.geom
        };
      });
      
      console.log(`Cargados ${segments.length} segmentos desde Supabase`);
      showToast(`Cargados ${segments.length} segmentos desde Supabase`);
    } else {
      // Si no hay datos en Supabase, cargar desde archivo local
      await loadFromLocalFile();
    }
    
    document.getElementById('total-segs').textContent = segments.length;
    buildLayers();
    detectIntersections();
    updateStats();
    
  } catch (e) {
    console.error('Error cargando desde Supabase:', e);
    console.log('Cargando desde archivo local...');
    await loadFromLocalFile();
  }
}

// Función auxiliar para cargar desde archivo local (contenido actual de loadGeoJSON)
async function loadFromLocalFile(){
  try {
    const response = await fetch('./calles_segmentadas.geojson');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const geojsonData = await response.json();
    geojson = geojsonData;
    segments = geojsonData.features.map((f, i) => ({
      id: f.properties.fid || i + 1,
      name: f.properties.name || '',
      props: { ...f.properties, estado: f.properties.estado || 'pendiente' },
      geom: f.geometry
    }));
    console.log(`Cargados ${segments.length} segmentos desde archivo local`);
  } catch (e) {
    console.error('Error cargando archivo local:', e);
    showToast('Error cargando GeoJSON local');
  }
}
```

### 3.4 Nueva Función: Guardar en Supabase

Agregar nueva función para guardar cambios:

```javascript
// ==================== GUARDAR EN SUPABASE ====================
async function guardarEnSupabase() {
  if (segments.length === 0) {
    showToast('No hay segmentos para guardar');
    return;
  }
  
  showToast('Guardando en Supabase...');
  
  let actualizados = 0;
  let errores = 0;
  const batchSize = 50;
  
  // Procesar en lotes para no saturar la API
  for (let i = 0; i < segments.length; i += batchSize) {
    const lote = segments.slice(i, i + batchSize);
    
    for (const seg of lote) {
      const { error } = await supabase
        .from('calles_pavimentadas')
        .upsert({
          fid: seg.id,
          nombre: seg.name,
          estado: seg.props.estado,
          tipo_obra: seg.props.tipo_obra,
          entre_calle_1: seg.props.entre_calle_1,
          entre_calle_2: seg.props.entre_calle_2,
          fecha_aprobacion_concejo: seg.props.fecha_aprobacion_concejo,
          fecha_inauguracion: seg.props.fecha_inauguracion,
          observaciones: seg.props.observaciones,
          geom: seg.geom,
          // Mantener longitud_m si existe
          longitud_m: seg.props.longitud_m
        }, {
          onConflict: 'fid' // Upsert basado en fid único
        });
      
      if (error) {
        console.error(`Error guardando segmento ${seg.id}:`, error);
        errores++;
      } else {
        actualizados++;
      }
    }
  }
  
  showToast(`Guardado: ${actualizados} segmentos, ${errores} errores`);
}
```

### 3.5 Agregar Botón en la UI

Agregar en el footer del sidebar (línea ~172-175):

```html
<div class="footer">
  <button class="btn btn-secondary" onclick="exportGeoJSON()">⬇ Exportar Final</button>
  <button class="btn btn-secondary" onclick="guardarProgreso()">💾 Guardar Progreso</button>
  <button class="btn btn-primary" onclick="guardarEnSupabase()">☁️ Guardar en Supabase</button>
</div>
```

### 3.6 Nueva Función: Importar Segmentos Adicionales

Agregar función para fusionar GeoJSON externo:

```javascript
// ==================== IMPORTAR SEGMENTOS ADICIONALES ====================
function importarSegmentosAdicionales(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const gj = JSON.parse(e.target.result);
      if (!gj.features || !Array.isArray(gj.features)) {
        showToast('Archivo GeoJSON inválido');
        return;
      }
      
      // Obtener fids existentes
      const fidsExistentes = new Set(segments.map(s => s.id));
      const maxFid = Math.max(...fidsExistentes);
      
      // Fusionar nuevos segmentos
      let nuevosCount = 0;
      gj.features.forEach((f, i) => {
        const fid = f.properties.fid || (maxFid + i + 1);
        if (!fidsExistentes.has(fid)) {
          segments.push({
            id: fid,
            name: f.properties.name || f.properties.nombre || `Segmento ${fid}`,
            props: {
              ...f.properties,
              estado: f.properties.estado || 'pendiente'
            },
            geom: f.geometry
          });
          nuevosCount++;
        }
      });
      
      if (nuevosCount > 0) {
        rebuildAll();
        showToast(`${nuevosCount} segmentos importados`);
      } else {
        showToast('No se encontraron segmentos nuevos');
      }
      
    } catch (err) {
      showToast('Error al importar: ' + err.message);
    }
  };
  reader.readAsText(file);
}
```

Agregar botón en la toolbar o sidebar:

```html
<!-- Agregar después del botón "Cargar Progreso" -->
<input type="file" id="file-import-nuevos" accept=".geojson" style="display:none" onchange="importarSegmentosAdicionales(event)">
<button class="btn btn-secondary" style="padding:4px 8px;font-size:11px;margin-top:4px" onclick="document.getElementById('file-import-nuevos').click()">📂 Importar Nuevos</button>
```

---

## 4. Actualización en la App React (Opcional)

### 4.1 Polling Simple (Recomendado)

En `src/components/PavimentoLayer.tsx`, agregar refresh periódico:

```typescript
// Agregar useEffect para polling
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Refresh polling calles pavimentadas...');
    cargarCalles(); // Tu función existente de carga
  }, 30000); // Cada 30 segundos
  
  return () => clearInterval(interval);
}, []);
```

### 4.2 Supabase Realtime (Avanzado)

```typescript
import { RealtimeChannel } from '@supabase/supabase-js'

// En tu componente
const channelRef = useRef<RealtimeChannel | null>(null)

useEffect(() => {
  // Suscribirse a cambios en la tabla
  channelRef.current = supabase
    .channel('calles_pavimentadas_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'calles_pavimentadas'
      },
      (payload) => {
        console.log('Cambio detectado:', payload)
        cargarCalles() // Recargar datos
      }
    )
    .subscribe()

  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
  }
}, [])
```

---

## 5. Testing y Validación

### Checklist de Pruebas

- [ ] Cargar editor HTML y verificar que conecta a Supabase
- [ ] Clasificar segmentos (conservado/descartado)
- [ ] Click en "Guardar en Supabase" y verificar sin errores
- [ ] Ir a Supabase y verificar que los datos se actualizaron
- [ ] Importar GeoJSON externo con segmentos nuevos
- [ ] Verificar que segmentos nuevos se agregan (no reemplazan existentes)
- [ ] En la app React, verificar que los cambios se reflejan (polling/realtime)

### Comandos de Verificación

```sql
-- Ver últimos segmentos actualizados
SELECT fid, nombre, estado, updated_at 
FROM calles_pavimentadas 
ORDER BY updated_at DESC 
LIMIT 20;

-- Contar por estado después de clasificación
SELECT estado, COUNT(*) as cantidad 
FROM calles_pavimentadas 
GROUP BY estado;
```

---

## 6. Troubleshooting

### Problema: Error 403 Permission Denied

**Causa:** RLS (Row Level Security) está bloqueando el acceso

**Solución:**
```sql
-- Opción A: Deshabilitar RLS temporalmente (dev)
ALTER TABLE calles_pavimentadas DISABLE ROW LEVEL SECURITY;

-- Opción B: Agregar política para anon (solo si es seguro)
CREATE POLICY "Acceso anon en calles_pavimentadas" 
ON calles_pavimentadas 
FOR ALL TO anon USING (true) WITH CHECK (true);
```

### Problema: Segmentos no se actualizan

**Causa:** El upsert no encuentra el fid

**Solución:** Verificar que `fid` es UNIQUE en la tabla:
```sql
-- Verificar constraint
SELECT conname FROM pg_constraint 
WHERE conname LIKE '%fid%unique%' OR conname LIKE '%unique%fid%';

-- Agregar unique si no existe
ALTER TABLE calles_pavimentadas 
ADD CONSTRAINT calles_pavimentadas_fid_key UNIQUE (fid);
```

### Problema: Geometría no se guarda

**Causa:** El formato de la geometría no es compatible

**Solución:** Asegurar que la geometría sea GeoJSON válido:
```javascript
// Verificar antes de guardar
console.log('Geometría:', JSON.stringify(seg.geom));
// Debe ser: { type: 'LineString' | 'MultiLineString', coordinates: [...] }
```

---

## 7. Próximos Pasos

Una vez implementado:

1. **Migración inicial**: Clasificar los 2422 segmentos en el editor
2. **Exportar conservados**: Generar GeoJSON final solo con calles pavimentadas
3. **Importar a Supabase**: Reemplazar los 875 segmentos viejos con los nuevos clasificados
4. **Habilitar Realtime**: Para que todas las interfaces se sincronicen en vivo

---

## 8. Referencias

- [Supabase JS Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostGIS + Supabase](https://supabase.com/docs/guides/database/extensions/postgis)
