-- Agregar campos de luminaria a la tabla puntos_relevamiento
-- Basados en el esquema de: Luminaria (gob_chajari_gestion_iluminacion.luminaria).csv

ALTER TABLE public.puntos_relevamiento
  ADD COLUMN IF NOT EXISTS tipo_luminaria TEXT DEFAULT 'LED 150W',
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS barrio_nombre TEXT,
  ADD COLUMN IF NOT EXISTS estado_base TEXT,
  ADD COLUMN IF NOT EXISTS sin_luz BOOLEAN DEFAULT false;

-- Comentarios para documentar el esquema
COMMENT ON COLUMN public.puntos_relevamiento.tipo_luminaria IS 'Tipo y potencia de la luminaria (ej: LED 150W, Sodio 150W)';
COMMENT ON COLUMN public.puntos_relevamiento.direccion IS 'Dirección de la luminaria (calle + altura, del geocodificador)';
COMMENT ON COLUMN public.puntos_relevamiento.barrio_nombre IS 'Nombre del barrio (redundante pero útil para consultas directas)';
COMMENT ON COLUMN public.puntos_relevamiento.estado_base IS 'Estado físico de la base del poste';
COMMENT ON COLUMN public.puntos_relevamiento.sin_luz IS 'True si la luminaria estaba sin luz al momento del relevamiento';
