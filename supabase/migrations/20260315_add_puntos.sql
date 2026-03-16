-- Tabla para los puntos de luminarias oficiales/relevados
CREATE TABLE IF NOT EXISTS public.puntos_relevamiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barrio_id UUID NOT NULL REFERENCES public.barrios(id) ON DELETE CASCADE,
    geom geometry(Point, 4326) NOT NULL,
    nombre TEXT,
    propiedades JSONB DEFAULT '{}'::jsonb,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index espacial para búsquedas rápidas
CREATE INDEX IF NOT EXISTS points_geom_idx ON public.puntos_relevamiento USING GIST (geom);

-- RLS (Row Level Security)
ALTER TABLE public.puntos_relevamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puntos visibles para todos"
    ON public.puntos_relevamiento FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden insertar puntos"
    ON public.puntos_relevamiento FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'a.m.saposnik@gmail.com'));
