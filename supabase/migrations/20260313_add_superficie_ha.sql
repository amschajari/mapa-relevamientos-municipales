-- Agregar columna de superficie_ha a la tabla de barrios si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='barrios' AND column_name='superficie_ha') THEN
        ALTER TABLE public.barrios ADD COLUMN superficie_ha NUMERIC;
    END IF;
END $$;

-- Comentario para el campo
COMMENT ON COLUMN public.barrios.superficie_ha IS 'Superficie del barrio en Hectáreas, calculada desde el GeoJSON.';
