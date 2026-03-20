import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elczfqaevdnomwflgvka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .from('puntos_relevamiento')
    .select('id, nombre, cableado, propiedades')
    .eq('nombre', 'LedSantaFe 1425');
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log('Result count:', data.length);
  data.forEach((row, i) => {
    console.log(`Row ${i}: id=${row.id}, cableado=${row.cableado}`);
    console.log(` -> propiedades:`, JSON.stringify(row.propiedades));
  });
}
checkDB();
