const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://elczfqaevdnomwflgvka.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ'
);

(async () => {
  let allData = [];
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from('puntos_relevamiento')
      .select('nombre, barrio_nombre, tipo_luminaria, sin_luz, cableado, estado_base, direccion, created_at')
      .range(i * 1000, (i + 1) * 1000 - 1);
    if (data) allData = allData.concat(data);
  }

  const lines = ['nombre,barrio,tipo_luminaria,sin_luz,cableado,estado_base,direccion,created_at'];
  allData.forEach(r => {
    const cols = [
      r.nombre,
      r.barrio_nombre || '',
      r.tipo_luminaria || '',
      r.sin_luz || '',
      r.cableado || '',
      r.estado_base || '',
      r.direccion || '',
      r.created_at || ''
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"');
    lines.push(cols.join(','));
  });

  fs.writeFileSync('supabase_luminarias.csv', lines.join('\n'), 'utf-8');
  console.log('Supabase exportado: ' + allData.length);

  // Parse Odoo CSV
  const odooRaw = fs.readFileSync('docs/odoo_24062026_1854.csv', 'utf-8');
  const odooLines = odooRaw.split('\n').filter(l => l.trim());
  const odooNames = odooLines.slice(1).map(l => {
    let cur = '', inQ = false, cols = [];
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols[0];
  });

  const supabaseNames = allData.map(r => r.nombre);

  console.log('Odoo:', odooNames.length);
  console.log('Supabase:', supabaseNames.length);

  const odooSet = new Set(odooNames);
  const supabaseSet = new Set(supabaseNames);

  const extraSB = supabaseNames.filter(n => !odooSet.has(n));
  const extraOdoo = odooNames.filter(n => !supabaseSet.has(n));

  console.log('\nEn Supabase pero NO en Odoo (' + extraSB.length + '):');
  extraSB.forEach(n => console.log('  ->', n));

  console.log('\nEn Odoo pero NO en Supabase (' + extraOdoo.length + '):');
  extraOdoo.forEach(n => console.log('  ->', n));
})();
