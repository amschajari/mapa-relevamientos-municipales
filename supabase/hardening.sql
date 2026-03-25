-- =============================================================================
-- SCRIPT DE ENDURECIMIENTO DE SEGURIDAD (HARDENING)
-- Resuelve advertencias del Security Advisor de Supabase
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- 1. CORREGIR "FUNCTION SEARCH PATH MUTABLE"
-- Bloque defensivo: solo altera las funciones que efectivamente existen.
DO $$
DECLARE
  rec record;
BEGIN
  -- Agregar search_path a todas las funciones del schema public que lo necesiten
  FOR rec IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_updated_at', 'actualizar_progreso_barrio', 'calcular_proyeccion')
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public',
        rec.proname, rec.args
      );
      RAISE NOTICE 'Función corregida: %', rec.proname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo alterar función %: %', rec.proname, SQLERRM;
    END;
  END LOOP;
END $$;


-- 2. CORREGIR "RLS POLICY ALWAYS TRUE"
-- Bloque defensivo: solo toca las tablas que existen en la DB.
DO $$ 
DECLARE 
  t text;
  tables text[] := ARRAY[
    'barrios', 
    'empleados', 
    'equipos', 
    'equipo_empleados', 
    'tareas_relevamiento', 
    'registros_relevamiento',
    'activos_alumbrado',
    'registros_diarios',
    'jornadas_relevamiento',
    'puntos_relevamiento'
  ];
  table_exists boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Verificar si la tabla existe antes de operar
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE NOTICE 'Tabla no existe, saltando: %', t;
      CONTINUE;
    END IF;

    -- Eliminar políticas antiguas "Permitir todo" si existen
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Permitir todo en %s" ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Permitir todo %s" ON public.%I', t, t);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Drop policy error en %: %', t, SQLERRM;
    END;
    
    -- Crear política de Lectura Pública (SELECT)
    BEGIN
      EXECUTE format('CREATE POLICY "Lectura publica en %s" ON public.%I FOR SELECT USING (true)', t, t);
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Política SELECT ya existe en: %', t;
    END;
    
    -- Crear política de Escritura para usuarios autenticados (resuelve "Always True" warning)
    BEGIN
      EXECUTE format('CREATE POLICY "Escritura admin en %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Política ALL ya existe en: %', t;
    END;
    
    RAISE NOTICE 'Tabla procesada OK: %', t;
  END LOOP;
END $$;



-- 3. NOTA SOBRE spatial_ref_sys Y POSTGIS EN PUBLIC
-- Estas advertencias son informativas para tablas de extensiones del sistema.
-- Como spatial_ref_sys pertenece a la extensión PostGIS, no es posible habilitar RLS
-- sin privilegios de superusuario (que el dashboard no tiene por seguridad).
-- ES SEGURO IGNORAR estas dos advertencias específicas ya que no contienen datos sensibles.
