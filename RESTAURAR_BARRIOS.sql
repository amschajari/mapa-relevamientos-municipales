-- RESTAURACION COMPLETA TABLA BARRIOS
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ⚠️ Borra todo y re-inserta los 45 barrios originales

DELETE FROM barrios;

INSERT INTO barrios (nombre, superficie_ha, estado, progreso, luminarias_estimadas, luminarias_relevadas) VALUES
  ('Eva Perón',             12.50, 'pendiente', 0, 50, 0),
  ('Centro',                42.30, 'pendiente', 0, 170, 0),
  ('San Clemente',          38.80, 'pendiente', 0, 155, 0),
  ('La Tablada',            35.20, 'pendiente', 0, 141, 0),
  ('Villa Alejandrina',     33.60, 'pendiente', 0, 134, 0),
  ('Vélez Sarsfield',       18.90, 'pendiente', 0, 76, 0),
  ('Santa Rosa',            52.10, 'pendiente', 0, 208, 0),
  ('Chaco',                 28.40, 'pendiente', 0, 114, 0),
  ('Tacuabe',               32.70, 'pendiente', 0, 131, 0),
  ('Pinar',                 36.50, 'pendiente', 0, 146, 0),
  ('San José Obrero',       41.20, 'pendiente', 0, 165, 0),
  ('Aero Club',             89.30, 'pendiente', 0, 357, 0),
  ('1 de Mayo',             37.80, 'pendiente', 0, 151, 0),
  ('Guarumba',              24.60, 'pendiente', 0, 98, 0),
  ('Angelita Tagliapietra', 16.30, 'pendiente', 0, 65, 0),
  ('Tropezon',              26.80, 'pendiente', 0, 107, 0),
  ('Parque',                31.40, 'pendiente', 0, 126, 0),
  ('Sacachispas',           30.20, 'pendiente', 0, 121, 0),
  ('Salto',                 20.10, 'pendiente', 0, 80, 0),
  ('Retobo',                4.20,  'pendiente', 0, 17, 0),
  ('Estación',              22.80, 'pendiente', 0, 91, 0),
  ('Los Trifolios',         28.90, 'pendiente', 0, 116, 0),
  ('El Naranjal',           26.50, 'pendiente', 0, 106, 0),
  ('Tagué',                 68.40, 'pendiente', 0, 274, 0),
  ('San Isidro',            61.70, 'pendiente', 0, 247, 0),
  ('Paso Chajarí',          31.20, 'pendiente', 0, 125, 0),
  ('Pancho Ramirez',        2.10,  'pendiente', 0, 8, 0),
  ('Centenario',            5.80,  'pendiente', 0, 23, 0),
  ('Villa Anita',           3.90,  'pendiente', 0, 16, 0),
  ('Jardín',                34.60, 'pendiente', 0, 138, 0),
  ('100 Viviendas',         2.80,  'pendiente', 0, 11, 0),
  ('120 Viviendas',         4.50,  'pendiente', 0, 18, 0),
  ('33 Vivienas',           1.90,  'pendiente', 0, 8, 0),
  ('22 Viviendas',          0.80,  'pendiente', 0, 3, 0),
  ('40 Viviendas',          1.60,  'pendiente', 0, 6, 0),
  ('Verde',                 8.70,  'pendiente', 0, 35, 0),
  ('El Cerro',              27.30, 'pendiente', 0, 109, 0),
  ('Los Lapachos',          5.30,  'pendiente', 0, 21, 0),
  ('Loteo Peñaloza',        9.20,  'pendiente', 0, 37, 0),
  ('Loteo Todone',          26.10, 'pendiente', 0, 104, 0),
  ('Loteo Pro.Cre.Ar',      1.50,  'pendiente', 0, 6, 0),
  ('Bicentenario',          8.10,  'pendiente', 0, 32, 0),
  ('Loteo Veller',          9.80,  'pendiente', 0, 39, 0),
  ('Las 14',                43.50, 'pendiente', 0, 174, 0),
  ('Los Alamos',            92.40, 'pendiente', 0, 370, 0);

-- Re-linkear puntos de San Clemente al nuevo ID del barrio
UPDATE puntos_relevamiento
SET barrio_id = (SELECT id FROM barrios WHERE nombre = 'San Clemente')
WHERE barrio_nombre = 'San Clemente';

-- Verificación final
SELECT nombre, luminarias_estimadas FROM barrios ORDER BY nombre;
