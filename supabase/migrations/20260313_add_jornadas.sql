-- Tabla para registrar jornadas de trabajo diarias
CREATE TABLE IF NOT EXISTS public.jornadas_relevamiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barrio_id UUID NOT NULL REFERENCES public.barrios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    agentes INTEGER NOT NULL DEFAULT 2,
    horas INTEGER NOT NULL DEFAULT 3,
    luminarias_relevadas INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.jornadas_relevamiento ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.jornadas_relevamiento FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserción a administradores" 
ON public.jornadas_relevamiento FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Aquí se podría refinar por rol si se usa custom claims
