import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elczfqaevdnomwflgvka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .from('puntos_relevamiento')
    .select('id, nombre, cableado, propiedades');
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  const aereos = data.filter(d => 
    d.cableado === 'Aéreo' || 
    d.propiedades?.cableado === 'Aéreo' || 
    d.propiedades?.tipo_de_cableado === 'Aéreo' || 
    d.propiedades?.alimentacion === 'Aéreo'
  );
  
  console.log('Total records:', data.length);
  console.log('Total Aéreos:', aereos.length);
  if (aereos.length > 0) {
    console.log('Sample aéreo:', aereos[0]);
  }
}
checkDB();
