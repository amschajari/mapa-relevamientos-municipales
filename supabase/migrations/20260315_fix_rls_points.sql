DROP POLICY IF EXISTS "Solo admins pueden insertar puntos" ON public.puntos_relevamiento;
DROP POLICY IF EXISTS "Solo admins pueden borrar puntos" ON public.puntos_relevamiento;
DROP POLICY IF EXISTS "Cualquiera puede ver los puntos" ON public.puntos_relevamiento;

CREATE POLICY "Solo admins pueden insertar puntos"
    ON public.puntos_relevamiento FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = 'a.m.saposnik@gmail.com');

CREATE POLICY "Solo admins pueden borrar puntos"
    ON public.puntos_relevamiento FOR DELETE
    USING (auth.jwt() ->> 'email' = 'a.m.saposnik@gmail.com');

CREATE POLICY "Cualquiera puede ver los puntos"
    ON public.puntos_relevamiento FOR SELECT
    USING (true);
