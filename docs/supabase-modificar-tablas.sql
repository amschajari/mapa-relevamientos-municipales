-- =============================================================================
-- MODIFICAR TABLAS EXISTENTES PARA RELEVAMIENTO
-- Ejecutar en: Supabase SQL Editor
-- Proyecto: elczfqaevdnomwflgvka
-- =============================================================================

-- =============================================================================
-- 1. AGREGAR COLUMNAS A "activos_alumbrado" PARA RELEVAMIENTO
-- =============================================================================

-- Datos de relevamiento
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS relevado BOOLEAN DEFAULT false;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS fecha_relevamiento TIMESTAMPTZ;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS relevado_por UUID; -- FK a empleado

-- Datos de campo (los que van a cargar en terreno)
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS barrio TEXT;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS tipo_cableado TEXT; -- 'Aéreo', 'Subterráneo', 'No identificable'
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS tipologia TEXT; -- 'Plaza (hasta 3m)', 'Jirafa (+8m)'
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS estado_base TEXT; -- 'Sin base', 'Buena', 'Mala'
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS numero_recambios INTEGER DEFAULT 0;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS estado_actual TEXT; -- 'Funcionando', 'Apagada', 'Intermitente', 'Dañada'

-- Metadata
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS validado BOOLEAN DEFAULT false;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS validado_por UUID;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMPTZ;

-- ==== NUEVOS CAMPOS AGREGADOS (2026-03-11) ====
-- Check de encendido/apagado (estado cuando debe estar encendida)
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS estado_encendido TEXT; -- 'Encendida', 'Apagada', 'Intermitente', 'No aplica (día)'
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS fecha_check_encendido DATE;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS hora_check_encendido TIME;

-- Fechas de garantía
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS fecha_compra DATE;
ALTER TABLE activos_alumbrado ADD COLUMN IF NOT EXISTS fecha_vencimiento_garantia DATE;

-- =============================================================================
-- 2. CREAR TABLA DE BARRIOS (si no existe)
-- =============================================================================
-- Los barrios se cargan desde el GeoJSON, pero también guardamos en DB
CREATE TABLE IF NOT EXISTS barrios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    estado TEXT DEFAULT 'pendiente', -- pendiente, progreso, completado, pausado
    progreso NUMERIC(5,2) DEFAULT 0,
    luminarias_estimadas INTEGER DEFAULT 0,
    luminarias_relevadas INTEGER DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    observaciones TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. CREAR TABLA DE EMPLEADOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT,
    telefono TEXT,
    email TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. CREAR TABLA DE REGISTROS DIARIOS (para proyección)
-- =============================================================================
-- Acá se registra cuántos relevamientos se hicieron por día
CREATE TABLE IF NOT EXISTS registros_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    cantidad_luminarias INTEGER DEFAULT 0,
    barrio_id UUID REFERENCES barrios(id),
    empleado_id UUID REFERENCES empleados(id),
    horas_trabajadas NUMERIC(5,2), -- horas que trabajaron
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. HABILITAR RLS (seguridad)
-- =============================================================================
ALTER TABLE activos_alumbrado ENABLE ROW LEVEL SECURITY;
ALTER TABLE barrios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;

-- Políticas (permitir todo por ahora)
CREATE POLICY "Permitir todo activos_alumbrado" ON activos_alumbrado FOR ALL USING (true);
CREATE POLICY "Permitir todo barrios" ON barrios FOR ALL USING (true);
CREATE POLICY "Permitir todo empleados" ON empleados FOR ALL USING (true);
CREATE POLICY "Permitir todo registros_diarios" ON registros_diarios FOR ALL USING (true);

-- =============================================================================
-- 6. FUNCIÓN PARA ACTUALIZAR BARRIOS DESDE APP
-- =============================================================================
-- Esta función la usará la app para actualizar progreso
CREATE OR REPLACE FUNCTION actualizar_progreso_barrio(
    p_barrio_nombre TEXT,
    p_luminarias_relevadas INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE barrios 
    SET 
        luminarias_relevadas = p_luminarias_relevadas,
        progreso = CASE 
            WHEN luminarias_estimadas > 0 
            THEN LEAST(100, (p_luminarias_relevadas::NUMERIC / luminarias_estimadas) * 100)
            ELSE 0
        END,
        estado = CASE 
            WHEN progreso >= 100 THEN 'completado'
            WHEN progreso > 0 THEN 'progreso'
            ELSE 'pendiente'
        END,
        updated_at = NOW()
    WHERE nombre = p_barrio_nombre;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. FUNCIÓN PARA CALCULAR PROYECCIÓN
-- =============================================================================
-- Retorna días estimados para completar todos los barrios
CREATE OR REPLACE FUNCTION calcular_proyeccion()
RETURNS TABLE (
    dias_estimados INTEGER,
    fecha_fin_estimada DATE,
    promedio_diario NUMERIC,
    total_relevado INTEGER,
    total_estimado INTEGER
) AS $$
DECLARE
    v_promedio NUMERIC;
    v_total_relevado INTEGER;
    v_total_estimado INTEGER;
    v_dias INTEGER;
BEGIN
    -- Calcular promedio diario (últimos 30 días)
    SELECT COALESCE(AVG(cantidad_luminarias), 0)
    INTO v_promedio
    FROM registros_diarios
    WHERE fecha >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Totales
    SELECT COALESCE(SUM(luminarias_relevadas), 0), COALESCE(SUM(luminarias_estimadas), 0)
    INTO v_total_relevado, v_total_estimado
    FROM barrios;
    
    -- Calcular días restantes
    IF v_promedio > 0 AND (v_total_estimado - v_total_relevado) > 0 THEN
        v_dias := CEIL((v_total_estimado - v_total_relevado) / v_promedio);
    ELSE
        v_dias := NULL;
    END IF;
    
    RETURN QUERY SELECT 
        v_dias,
        CURRENT_DATE + v_dias,
        v_promedio,
        v_total_relevado,
        v_total_estimado;
END;
$$ LANGUAGE plpgsql;
