const fs = require('fs');

function calcArea(feature) {
  try {
    const rings = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
    let area = 0;
    for (let i = 0; i < rings.length - 1; i++) {
      area += (rings[i][0] * rings[i+1][1]) - (rings[i+1][0] * rings[i][1]);
    }
    const areaM2 = Math.abs(area / 2) * 111320 * 111320 * Math.cos(-30.75 * Math.PI / 180);
    return Math.round((areaM2 / 10000) * 100) / 100;
  } catch(e) { return 1; }
}

const geojson = JSON.parse(fs.readFileSync('src/data/barrios-chajari.json', 'utf8'));

let sql = '-- RESTAURACION COMPLETA DE BARRIOS (45 registros)\n';
sql += '-- Ejecutar en Supabase Dashboard -> SQL Editor\n\n';
sql += 'DELETE FROM barrios;\n\n';
sql += 'INSERT INTO barrios (nombre, superficie_ha, estado, progreso, luminarias_estimadas, luminarias_relevadas) VALUES\n';

const rows = geojson.features.map(f => {
  const ha = calcArea(f);
  const nom = f.properties.Nombre.replace(/'/g, "''");
  return `  ('${nom}', ${ha}, 'pendiente', 0, ${Math.round(ha*4)}, 0)`;
});

sql += rows.join(',\n') + ';\n\n';
sql += "-- Re-linkear puntos de San Clemente al nuevo registro\n";
sql += "UPDATE puntos_relevamiento SET barrio_id = (SELECT id FROM barrios WHERE nombre = 'San Clemente') WHERE barrio_nombre = 'San Clemente';\n";

fs.writeFileSync('RESTAURAR_BARRIOS.sql', sql);
console.log('SQL generado: RESTAURAR_BARRIOS.sql');
console.log('Barrios en SQL:', geojson.features.length);
