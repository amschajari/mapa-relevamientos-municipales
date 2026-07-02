const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://elczfqaevdnomwflgvka.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ'
);

(async () => {
  let allData = [];
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from('puntos_relevamiento')
      .select('nombre')
      .range(i * 1000, (i + 1) * 1000 - 1);
    if (data) allData = allData.concat(data);
  }

  const sbNames = new Set(allData.map(r => r.nombre));

  const raw = fs.readFileSync('docs/2583.csv', 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const odooNames = lines.slice(1).map(l => {
    let cur = '', inQ = false, cols = [];
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols[0];
  });
  const odooSet = new Set(odooNames);

  console.log('Odoo:', odooNames.length);
  console.log('Supabase:', allData.length);

  const extraSB = allData.filter(r => !odooSet.has(r.nombre));
  const extraOdoo = odooNames.filter(n => !sbNames.has(n));

  console.log('\nEn Supabase pero NO en Odoo (' + extraSB.length + '):');
  extraSB.forEach(r => console.log('  ' + r.nombre));

  console.log('\n\nEn Odoo pero NO en Supabase (' + extraOdoo.length + '):');
  extraOdoo.forEach(n => console.log('  ' + n));

  // Check duplicates in Odoo
  const countMap = {};
  odooNames.forEach(n => { countMap[n] = (countMap[n] || 0) + 1; });
  const dupes = Object.entries(countMap).filter(([,c]) => c > 1).sort(([,a],[,b]) => b-a);
  console.log('\nDuplicados en Odoo (' + dupes.length + '):');
  dupes.forEach(([n, c]) => console.log('  "' + n + '" x' + c));
})();
