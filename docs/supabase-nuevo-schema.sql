-- =============================================================================
-- NUEVO SCHEMA PARA SISTEMA DE RELEVAMIENTO
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- 1. TABLA: BARRIOS
-- Los 45 barrios de Chajarí (referencia del GeoJSON)
CREATE TABLE IF NOT EXISTS barrios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    estado TEXT DEFAULT 'pendiente', -- pendiente, progreso, completado, pausado
    progreso NUMERIC(5,2) DEFAULT 0, -- 0-100
    luminarias_estimadas INTEGER DEFAULT 0,
    luminarias_relevadas INTEGER DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    observaciones TEXT,
    geom GEOMETRY(MultiPolygon, 4326), -- para polígono del barrio
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: EMPLEADOS
-- Personal que sale a relevar
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

-- 3. TABLA: EQUIPOS
-- Grupos de trabajo
CREATE TABLE IF NOT EXISTS equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL, -- "Equipo A", "Equipo Norte", etc.
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: EQUIPO_EMPLEADOS (relación many-to-many)
CREATE TABLE IF NOT EXISTS equipo_empleados (
    equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
    PRIMARY KEY (equipo_id, empleado_id)
);

-- 5. TABLA: TAREAS_RELEVAMIENTO
-- Tareas asignadas a equipos/empleados
CREATE TABLE IF NOT EXISTS tareas_relevamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barrio_id UUID REFERENCES barrios(id),
    nombre TEXT NOT NULL, -- "Barrio Centro", "Zona Norte", etc.
    tipo TEXT NOT NULL, -- 'Barrio', 'Calle', 'Zona'
    estado TEXT DEFAULT 'pendiente', -- pendiente, en_progreso, completado, pausado
    progreso NUMERIC(5,2) DEFAULT 0,
    
    -- Asignación
    equipo_id UUID REFERENCES equipos(id),
    empleado_id UUID REFERENCES empleados(id),
    
    -- Métricas
    fecha_inicio DATE,
    fecha_fin DATE,
    luminarias_estimadas INTEGER DEFAULT 0,
    luminarias_relevadas INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: REGISTROS_RELEVAMIENTO
-- Cada luminaria censada en campo
CREATE TABLE IF NOT EXISTS registros_relevamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID REFERENCES tareas_relevamiento(id),
    barrio_id UUID REFERENCES barrios(id),
    empleado_id UUID REFERENCES empleados(id),
    
    -- Ubicación
    direccion TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    
    -- Datos de la luminaria
    tipo_luminaria TEXT, -- 'LED', 'Sodio', 'Otro'
    tipo_cableado TEXT, -- 'Aéreo', 'Subterráneo', 'No identificable'
    tipologia TEXT, -- 'Plaza (hasta 3m)', 'Jirafa (+8m)'
    estado_base TEXT, -- 'Sin base', 'Buena', 'Mala'
    
    -- Estado actual
    estado_actual TEXT, -- 'Funcionando', 'Apagada', 'Intermitente', 'Dañada'
    
    -- Recambios y mantenimiento
    numero_recambios INTEGER DEFAULT 0,
    fecha_ultimo_mantenimiento DATE,
    observacion_mantenimiento TEXT,
    
    -- Observaciones generales
    observaciones TEXT,
    
    -- Fotos (URLs)
    fotos TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- Para seguridad de datos
ALTER TABLE barrios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_relevamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_relevamiento ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS DE ACCESO (permitir todo para desarrollo)
-- En producción, restrictuir según necesidad
CREATE POLICY "Permitir todo en barrios" ON barrios FOR ALL USING (true);
CREATE POLICY "Permitir todo en empleados" ON empleados FOR ALL USING (true);
CREATE POLICY "Permitir todo en equipos" ON equipos FOR ALL USING (true);
CREATE POLICY "Permitir todo en equipo_empleados" ON equipo_empleados FOR ALL USING (true);
CREATE POLICY "Permitir todo en tareas_relevamiento" ON tareas_relevamiento FOR ALL USING (true);
CREATE POLICY "Permitir todo en registros_relevamiento" ON registros_relevamiento FOR ALL USING (true);

-- =============================================================================
-- FUNCIONES ÚTILES
-- =============================================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at automático
CREATE TRIGGER update_barrios_updated_at BEFORE UPDATE ON barrios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_equipos_updated_at BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tareas_relevamiento_updated_at BEFORE UPDATE ON tareas_relevamiento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_registros_relevamiento_updated_at BEFORE UPDATE ON registros_relevamiento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
