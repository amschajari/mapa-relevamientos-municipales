-- =============================================================================
-- FUNCIÓN RPC PARA IMPORTAR POLÍGONOS DE BARRIOS CON GEOMETRÍA
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- Función para upsert de barrio con geometría
CREATE OR REPLACE FUNCTION upsert_barrio_con_geometria(
  p_nombre TEXT,
  p_superficie_ha NUMERIC,
  p_luminarias_estimadas INTEGER,
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
  -- Buscar si ya existe el barrio
  SELECT id INTO v_existing_id
  FROM barrios
  WHERE nombre = p_nombre;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE: actualizar geometría y superficie
    UPDATE barrios
    SET
      superficie_ha = p_superficie_ha,
      geom = ST_GeomFromGeoJSON(p_geom),
      luminarias_estimadas = COALESCE(p_luminarias_estimadas, luminarias_estimadas),
      updated_at = NOW()
    WHERE id = v_existing_id;
    
    RETURN v_existing_id;
  ELSE
    -- INSERT: crear nuevo barrio con geometría
    INSERT INTO barrios (nombre, superficie_ha, luminarias_estimadas, geom)
    VALUES (p_nombre, p_superficie_ha, COALESCE(p_luminarias_estimadas, ROUND(p_superficie_ha * 4)), ST_GeomFromGeoJSON(p_geom))
    RETURNING id INTO v_id;
    
    RETURN v_id;
  END IF;
END;
$$;

-- Configurar search_path para la función
ALTER FUNCTION upsert_barrio_con_geometria(TEXT, NUMERIC, INTEGER, JSONB) SET search_path = public;

-- Verificar que se creó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Función upsert_barrio_con_geometria creada exitosamente';
END $$;
