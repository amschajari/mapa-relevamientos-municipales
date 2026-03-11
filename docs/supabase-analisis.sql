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

-- 2. VER COLUMNAS DE CADA TABLA (si hay tablas)
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3. CONTEO DE REGISTROS POR TABLA (solo si hay tablas)
-- Descomenta las líneas si tenés esas tablas:
-- SELECT 'barrios' as tabla, COUNT(*) as registros FROM barrios
-- UNION ALL SELECT 'luminarias', COUNT(*) FROM luminarias
-- UNION ALL SELECT 'medidores', COUNT(*) FROM medidores
-- UNION ALL SELECT 'reportes', COUNT(*) FROM reportes

-- 4. NOTAS:
-- =============================================================================
-- Si no hay tablas, simplemente ejecutá el script "supabase-nuevo-schema.sql"
-- para crear las tablas del sistema de relevamiento.
-- =============================================================================
