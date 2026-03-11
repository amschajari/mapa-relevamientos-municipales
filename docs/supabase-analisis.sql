-- =============================================================================
-- SCRIPT DE ANÁLISIS DE TABLAS EN SUPABASE
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- 1. VER TODAS LAS TABLAS EN EL SCHEMA PUBLIC
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VER COLUMNAS DE CADA TABLA
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3. CONTEO DE REGISTROS POR TABLA
SELECT 
    'barrios' as tabla, COUNT(*) as registros FROM barrios
UNION ALL
SELECT 'luminarias', COUNT(*) FROM luminarias
UNION ALL
SELECT 'medidores', COUNT(*) FROM medidores
UNION ALL
SELECT 'reportes', COUNT(*) FROM reportes
UNION ALL
SELECT 'tareas_relevamiento', COUNT(*) FROM tareas_relevamiento
UNION ALL
SELECT 'empleados', COUNT(*) FROM empleados
UNION ALL
SELECT 'equipos', COUNT(*) FROM equipos
UNION ALL
SELECT 'registros_relevamiento', COUNT(*) FROM registros_relevamiento
-- Agregar otras tablas que aparezcan en el resultado 1
;

-- 4. VER DATOS DE EJEMPLO DE CADA TABLA (primera fila)
-- Ejecutar manualmente para cada tabla:
-- SELECT * FROM nombre_tabla LIMIT 1;

-- =============================================================================
-- NOTAS PARA DECIDIR QUÉ BORRAR:
-- =============================================================================
-- 
-- Tablas que PODRÍAN no servir para el flujo actual:
-- - medidores: si no usamos medidores
-- - reportes: si es para gestión general, no para relevamiento
-- - Cualquier tabla vacía (0 registros)
--
-- Tablas que SÍ sirven para relevamiento:
-- - barrios: necesarios para el mapa
-- - tareas_relevamiento: para seguir el progreso
-- - empleados: para asignar personal
-- - equipos: para grupos de trabajo
-- - registros_relevamiento: para cada luminaria censada
-- - luminarias: para el registro de cada luminaria
--
-- =============================================================================
-- COMANDO PARA BORRAR UNA TABLA (cuidado: irreversible):
-- DROP TABLE nombre_tabla CASCADE;
-- =============================================================================
