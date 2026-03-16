// Usando fetch nativo de Node.js 18+

const SUPABASE_URL = 'https://elczfqaevdnomwflgvka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ'; // Anon key is enough if RLS allows or if I use service role (but I don't have it). 

async function resetData() {
  console.log('Iniciando limpieza de datos en Supabase...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/barrios?id=not.is.null`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        luminarias_estimadas: 0,
        luminarias_relevadas: 0,
        progreso: 0,
        estado: 'pendiente'
      })
    });

    if (response.ok) {
      console.log('✅ Éxito: Todos los barrios han sido reseteados a 0.');
    } else {
      const errorText = await response.text();
      console.error('❌ Error al resetear datos:', errorText);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

resetData();
