# Plan de Implementación: Capa de Calles Pavimentadas (GIS)

Este documento detalla el diagnóstico actual del sistema y el plan técnico para integrar la capa de calles pavimentadas utilizando PostGIS y React-Leaflet de forma eficiente.

## 1. Diagnóstico Técnico Actual

### Riesgos Identificados
*   **Carga Masiva (Full Scan):** Actualmente, las capas como `puntos_relevamiento` o `espacios_verdes` se descargan completas (`select *`). Al cargar calles (geometrías lineales densas), esto causará lentitud en el parseo de GeoJSON y consumo excesivo de memoria en el navegador.
*   **Duplicación de Estado:** Existe lógica de visibilidad en `barrioStore` y `mapStore`. Es necesario centralizar en `mapStore` (IDE-Style) para evitar bugs de sincronización en la UI.
*   **Clusterización:** El `MarkerClusterGroup` se destruye y recrea al cambiar filtros debido a su `key` dinámica, lo cual afecta la fluidez de la interfaz.

---

## 2. Implementación en Base de Datos (Supabase)

Se debe migrar la lógica de "archivos GeoJSON/Shapefile locales" a una tabla espacial con índices **GIST** y una función de consulta por **Bounding Box**.

### SQL de Migración (Ejecutar en Supabase SQL Editor)

```sql
-- 1. Crear tabla para la red vial
CREATE TABLE IF NOT EXISTS public.calles_pavimentadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    tipo TEXT CHECK (tipo IN ('calle', 'avenida', 'boulevard', 'pasaje')),
    material TEXT DEFAULT 'pavimento',
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice espacial (CRÍTICO para performance)
CREATE INDEX IF NOT EXISTS idx_calles_geom ON public.calles_pavimentadas USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_calles_tipo ON public.calles_pavimentadas (tipo);

-- 3. Habilitar RLS
ALTER TABLE public.calles_pavimentadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de calles"
ON public.calles_pavimentadas FOR SELECT
TO anon
USING (true);

-- 4. Función RPC para carga inteligente (BBOX + Simplificación)
-- Esta función reduce drásticamente el peso del GeoJSON según el nivel de zoom
CREATE OR REPLACE FUNCTION get_calles_en_bounds(
    min_lat FLOAT,
    min_lng FLOAT,
    max_lat FLOAT,
    max_lng FLOAT,
    p_tipos TEXT[] DEFAULT NULL,
    p_simplify FLOAT DEFAULT 0.00001
)
RETURNS TABLE(
    id UUID,
    nombre TEXT,
    tipo TEXT,
    geom JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.tipo,
        ST_AsGeoJSON(
            CASE 
                WHEN p_simplify > 0 THEN ST_SimplifyPreserveTopology(c.geom, p_simplify)
                ELSE c.geom
            END
        )::JSON as geom
    FROM calles_pavimentadas c
    WHERE c.geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
      AND (p_tipos IS NULL OR c.tipo = ANY(p_tipos));
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 3. Implementación Frontend (Plan de Acción)

### A. Centralización de Visibilidad
Mover el control de todas las capas a `mapStore.ts` bajo el dominio `pavimento`. Las capas ya están definidas en el store, solo falta cambiar su `source` a `'supabase'`.

### B. Hook de Carga Espacial (`useCallesViewport`)
Implementar un hook que escuche el evento `moveend` del mapa y llame a la función `get_calles_en_bounds`. Esto asegura que:
1.  Si el usuario está lejos (zoom bajo), las calles se vean simplificadas.
2.  Solo se carguen las calles que entran en la pantalla actual.

### C. Componente de Capa Eficiente
Crear `src/components/CallesPavimentadasLayer.tsx` siguiendo el patrón de `EspaciosVerdesLayer.tsx`, pero optimizado para líneas (weights variables para avenidas vs calles).

---

## 4. Checklist para mañana en la oficina

1.  [ ] **Ejecutar SQL:** Correr el script arriba provisto en Supabase.
2.  [ ] **Importar Datos:** Usar QGIS o un conversor GeoJSON para subir los datos del archivo `data/calles.shp` a la nueva tabla.
3.  [ ] **Limpieza de Repo:** Borrar los archivos `.shp`, `.dbf`, `.shx` de la carpeta `data/` una vez subidos a la DB para mantener el repositorio liviano.
4.  [ ] **Optimizar Clusterer:** Cambiar la `key` del `MarkerClusterGroup` en `ControlMap.tsx` por una estática (ej: `key="official-cluster"`) para evitar el lag de los filtros.
5.  [ ] **Test de Renderizado:** Verificar que al apagar/prender la capa en el nuevo `LayersPanel` (IDE Sidebar), el sistema responda instantáneamente.

---
**Senior GIS Lead Developer**
*Enfoque: Performance espacial y escalabilidad PostGIS.*
