-- =============================================================================
-- IMPORTAR 45 BARRIOS DESDE GEOJSON A SUPABASE
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- Los 45 barrios de Chajarí del GeoJSON

INSERT INTO barrios (nombre, estado, progreso, luminarias_estimadas, luminarias_relevadas)
VALUES 
('Eva Perón', 'pendiente', 0, 100, 0),
('Centro', 'pendiente', 0, 150, 0),
('San Clemente', 'pendiente', 0, 120, 0),
('La Tablada', 'pendiente', 0, 90, 0),
('Villa Alejandrina', 'pendiente', 0, 80, 0),
('Vélez Sarsfield', 'pendiente', 0, 85, 0),
('Santa Rosa', 'pendiente', 0, 75, 0),
('Chaco', 'pendiente', 0, 70, 0),
('Tacuabe', 'pendiente', 0, 65, 0),
('Pinar', 'pendiente', 0, 60, 0),
('San José Obrero', 'pendiente', 0, 95, 0),
('Aero Club', 'pendiente', 0, 55, 0),
('1 de Mayo', 'pendiente', 0, 80, 0),
('Guarumba', 'pendiente', 0, 70, 0),
('Angelita Tagliapietra', 'pendiente', 0, 65, 0),
('Tropezon', 'pendiente', 0, 75, 0),
('Parque', 'pendiente', 0, 90, 0),
('Sacachispas', 'pendiente', 0, 85, 0),
('Salto', 'pendiente', 0, 70, 0),
('Retobo', 'pendiente', 0, 60, 0),
('Estación', 'pendiente', 0, 55, 0),
('Los Trifolios', 'pendiente', 0, 50, 0),
('El Naranjal', 'pendiente', 0, 45, 0),
('Tagué', 'pendiente', 0, 40, 0),
('San Isidro', 'pendiente', 0, 75, 0),
('Paso Chajarí', 'pendiente', 0, 65, 0),
('Pancho Ramirez', 'pendiente', 0, 70, 0),
('Centenario', 'pendiente', 0, 85, 0),
('Villa Anita', 'pendiente', 0, 60, 0),
('Jardín', 'pendiente', 0, 55, 0),
('100 Viviendas', 'pendiente', 0, 100, 0),
('120 Viviendas', 'pendiente', 0, 120, 0),
('33 Vivienas', 'pendiente', 0, 33, 0),
('22 Viviendas', 'pendiente', 0, 22, 0),
('40 Viviendas', 'pendiente', 0, 40, 0),
('Verde', 'pendiente', 0, 50, 0),
('El Cerro', 'pendiente', 0, 45, 0),
('Los Lapachos', 'pendiente', 0, 55, 0),
('Loteo Peñaloza', 'pendiente', 0, 40, 0),
('Loteo Todone', 'pendiente', 0, 35, 0),
('Loteo Pro.Cre.Ar', 'pendiente', 0, 30, 0),
('Bicentenario', 'pendiente', 0, 65, 0),
('Loteo Veller', 'pendiente', 0, 35, 0),
('Las 14', 'pendiente', 0, 50, 0),
('Los Alamos', 'pendiente', 0, 60, 0)
ON CONFLICT (nombre) DO NOTHING;

-- Verificar cuántos se insertaron
SELECT COUNT(*) as total_barrios FROM barrios;

-- Ver todos los barrios
SELECT nombre, estado, progreso, luminarias_estimadas FROM barrios ORDER BY nombre;
