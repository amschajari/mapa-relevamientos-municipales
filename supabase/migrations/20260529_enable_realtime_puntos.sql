-- Habilitar Realtime en la tabla puntos_relevamiento
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurar que la tabla tiene la columna nombre como unique para upsert
-- (ya debería estar, pero queda como safety check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'puntos_relevamiento'
    AND indexname = 'puntos_relevamiento_nombre_unique'
  ) THEN
    CREATE UNIQUE INDEX puntos_relevamiento_nombre_unique
      ON public.puntos_relevamiento (nombre)
      WHERE nombre IS NOT NULL;
  END IF;
END $$;

-- 2. Habilitar Realtime para la tabla
-- Esto se puede hacer desde:
-- Dashboard → Database → Replication → elegir "puntos_relevamiento"
--
-- O alternativamente ejecutar:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.puntos_relevamiento;
--
-- Nota: si la publicación no existe, crearla primero:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.puntos_relevamiento;
