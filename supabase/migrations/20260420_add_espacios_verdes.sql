-- =============================================================================
-- TABLA: ESPACIOS VERDES
-- Crear tabla para almacenar polígonos de espacios verdes (parques, plazas, etc.)
-- =============================================================================

-- Crear tabla espacios_verdes
CREATE TABLE IF NOT EXISTS espacios_verdes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fid INTEGER UNIQUE,
    nombre TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- RLS: permisos
ALTER TABLE espacios_verdes ENABLE ROW LEVEL SECURITY;

-- Policy para lectura pública
CREATE POLICY "Allow public read espacios_verdes" ON espacios_verdes
    FOR SELECT USING (true);

-- Policy para escritura (solo authenticated)
CREATE POLICY "Allow authenticated write espacios_verdes" ON espacios_verdes
    FOR ALL USING (auth.role() = 'authenticated');

-- Índice espacial para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_espacios_verdes_geom 
    ON espacios_verdes USING GIST (geom);

-- Índice por nombre
CREATE INDEX IF NOT EXISTS idx_espacios_verdes_nombre 
    ON espacios_verdes (nombre);

-- Función para upsert de espacio verde con geometría
CREATE OR REPLACE FUNCTION upsert_espacio_verde(
    p_fid INTEGER,
    p_nombre TEXT,
    p_geom JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_existing_id UUID;
BEGIN
  -- Buscar si ya existe
  SELECT id INTO v_existing_id
  FROM espacios_verdes
  WHERE fid = p_fid;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE
    UPDATE espacios_verdes
    SET
      nombre = p_nombre,
      geom = ST_GeomFromGeoJSON(p_geom),
      updated_at = NOW()
    WHERE id = v_existing_id;
    
    RETURN v_existing_id;
  ELSE
    -- INSERT
    INSERT INTO espacios_verdes (fid, nombre, geom)
    VALUES (p_fid, p_nombre, ST_GeomFromGeoJSON(p_geom))
    RETURNING id INTO v_id;
    
    RETURN v_id;
  END IF;
END;
$$;

-- Configurar search_path
ALTER FUNCTION upsert_espacio_verde(INTEGER, TEXT, JSONB) SET search_path = public;

-- Comentarios
COMMENT ON TABLE espacios_verdes IS 'Espacios verdes de Chajarí: parques, plazas, plazoletas';
COMMENT ON COLUMN espacios_verdes.fid IS 'Identificador original del GeoJSON QGIS';
COMMENT ON COLUMN espacios_verdes.nombre IS 'Nombre del espacio verde';
COMMENT ON COLUMN espacios_verdes.geom IS 'Geometría MultiPolygon del espacio verde';

DO $$
BEGIN 
    RAISE NOTICE 'Tabla espacios_verdes creada exitosamente';
END $$;
