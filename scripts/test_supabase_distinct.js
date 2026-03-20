import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elczfqaevdnomwflgvka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .from('puntos_relevamiento')
    .select('cableado, propiedades');
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  const cab1 = new Set();
  const cab2 = new Set();
  data.forEach(d => {
    cab1.add(d.cableado);
    cab2.add(d.propiedades?.cableado);
    cab2.add(d.propiedades?.alimentacion);
    cab2.add(d.propiedades?.tipo_de_cableado);
    cab2.add(d.propiedades?.['tipo de cableado"']);
  });
  console.log('Distinto cableado column:', Array.from(cab1));
  console.log('Distinto propiedades cableado:', Array.from(cab2));
}
checkDB();
