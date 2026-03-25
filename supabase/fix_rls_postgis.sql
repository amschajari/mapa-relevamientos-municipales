-- =============================================================================
-- FIX DE SEGURIDAD: HABILITAR RLS EN TABLAS DE POSTGIS
-- Resuelve la alerta "Table publicly accessible" para spatial_ref_sys
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- 1. Intentar delegar la propiedad al rol postgres para poder habilitar RLS
-- (El error 42501 ocurre porque la tabla suele pertenecer a la extensión)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'spatial_ref_sys' AND schemaname = 'public') THEN
    -- Intentamos cambiar el dueño a 'postgres' (rol administrativo)
    EXECUTE 'ALTER TABLE public.spatial_ref_sys OWNER TO postgres';
    
    -- Habilitamos RLS
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    
    -- Creamos la política de lectura pública si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spatial_ref_sys' AND policyname = 'Permitir lectura pública en spatial_ref_sys') THEN
      EXECUTE 'CREATE POLICY "Permitir lectura pública en spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true)';
    END IF;
  END IF;
END $$;

-- 3. Opcional: Asegurar que otras tablas de extensiones tengan RLS si existen
-- (Normalmente solo spatial_ref_sys es la afectada en PostGIS)
-- ALTER TABLE IF EXISTS public.geography_columns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir lectura pública en geography_columns" ON public.geography_columns FOR SELECT USING (true);

-- ALTER TABLE IF EXISTS public.geometry_columns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir lectura pública en geometry_columns" ON public.geometry_columns FOR SELECT USING (true);
