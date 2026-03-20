import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elczfqaevdnomwflgvka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .rpc('get_columns', {}) // if they have it
    .select('*')
    .limit(1);
    
  // Alternatively we can just insert a fake record and see the error!
  const res = await supabase.from('puntos_relevamiento').insert({
      nombre: 'TestFakePoint',
      geom: `POINT(-57.9 -30.7)`,
      cableado: 'Aéreo Test'
  }).select();
  console.log('Insert test:', res);
  if (res.data) {
    await supabase.from('puntos_relevamiento').delete().eq('nombre', 'TestFakePoint');
  }
}
checkDB();
