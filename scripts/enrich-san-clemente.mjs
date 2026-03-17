/**
 * Script: enrich-san-clemente.mjs
 * 
 * Propósito:
 * 1. Exporta los puntos actuales de San Clemente como GeoJSON (backup)
 * 2. Realiza geocodificación inversa con Nominatim (OSM)
 * 3. Enriquece cada punto con datos del esquema municipal
 * 4. Actualiza la tabla puntos_relevamiento en Supabase
 * 
 * Uso: node scripts/enrich-san-clemente.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================================
// CONFIGURACIÓN
// ============================================================
const SUPABASE_URL = 'https://elczfqaevdnomwflgvka.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ'

// La service_role key se pasa como argumento: node script.mjs <SERVICE_KEY>
const SERVICE_KEY = process.argv[2]
if (!SERVICE_KEY) {
  console.error('❌ ERROR: Falta la service_role key.')
  console.error('   Uso: node scripts/enrich-san-clemente.mjs <SERVICE_ROLE_KEY>')
  console.error('   La encontrás en: Supabase → Settings → API → service_role')
  process.exit(1)
}

const BARRIO_NOMBRE = 'San Clemente'
const NOMINATIM_DELAY_MS = 1100

const ESTADO_BASE_OPTIONS = [
  'Con base en buenas condiciones',
  'Base deteriorada'
]

// Cliente para LEER (anon) y cliente para ESCRIBIR (service_role, bypasea RLS)
const supabaseRead = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseWrite = createClient(SUPABASE_URL, SERVICE_KEY)

// ============================================================
// HELPERS
// ============================================================

/** Espera N milisegundos */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** Normaliza una cadena de texto para usarla en el ID de luminaria */
const normalizeStreet = (street) => {
  if (!street) return 'Desconocida'
  return street
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '')     // Quitar espacios
    .replace(/[^a-zA-Z0-9]/g, '') // Solo alfanumérico
}

/** Extrae lat/lng del campo geom de Supabase */
const parseGeom = (geom) => {
  if (!geom) return null
  if (typeof geom === 'string' && geom.startsWith('POINT')) {
    const match = geom.match(/\((.*)\)/)
    if (match) {
      const [lng, lat] = match[1].split(' ').map(parseFloat)
      return { lat, lng }
    }
  }
  if (geom.type === 'Point') {
    return { lat: geom.coordinates[1], lng: geom.coordinates[0] }
  }
  return null
}

/** Consulta Nominatim para geocodificación inversa */
const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Municipalidad-Chajari-GIS/1.0 (a.m.saposnik@gmail.com)' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const road = data.address?.road || data.address?.pedestrian || data.address?.neighbourhood || 'Calle Desconocida'
    const houseNumber = data.address?.house_number || ''
    return { road, houseNumber, displayName: data.display_name }
  } catch (err) {
    console.warn(`  ⚠️  Nominatim error: ${err.message}`)
    return { road: 'Calle Desconocida', houseNumber: '', displayName: '' }
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🗺️  Enriquecimiento de Puntos - San Clemente')
  console.log('=============================================\n')

  // 1. Obtener el barrio_id de San Clemente
  console.log(`📍 Buscando barrio: ${BARRIO_NOMBRE}...`)
  const { data: barrios, error: barrioError } = await supabaseRead
    .from('barrios')
    .select('id, nombre')
    .ilike('nombre', `%${BARRIO_NOMBRE}%`)
  
  if (barrioError || !barrios?.length) {
    console.error('❌ Error obteniendo barrio:', barrioError || 'No encontrado')
    process.exit(1)
  }
  const barrio = barrios[0]
  console.log(`✅ Barrio encontrado: ${barrio.nombre} (id: ${barrio.id})\n`)

  // 2. Obtener los puntos actuales
  console.log(`🔍 Obteniendo puntos de ${BARRIO_NOMBRE}...`)
  const { data: puntos, error: puntosError } = await supabaseRead
    .from('puntos_relevamiento')
    .select('*')
    .eq('barrio_id', barrio.id)

  if (puntosError || !puntos?.length) {
    console.error('❌ Error obteniendo puntos:', puntosError || 'No encontrados')
    process.exit(1)
  }
  console.log(`✅ ${puntos.length} puntos encontrados.\n`)

  // 3. BACKUP: Exportar como GeoJSON
  const backupDir = join(__dirname, 'backup')
  mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = join(backupDir, `san-clemente-backup-${timestamp}.geojson`)

  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      exportedAt: new Date().toISOString(),
      barrio: barrio.nombre,
      barrioId: barrio.id,
      totalPoints: puntos.length
    },
    features: puntos.map(p => {
      const coords = parseGeom(p.geom)
      return {
        type: 'Feature',
        properties: { ...p, geom: undefined },
        geometry: coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : null
      }
    }).filter(f => f.geometry !== null)
  }

  writeFileSync(backupPath, JSON.stringify(geojson, null, 2), 'utf-8')
  console.log(`💾 BACKUP guardado en:\n   ${backupPath}\n`)

  // 4. Geocodificación inversa y enriquecimiento
  console.log(`🌐 Iniciando geocodificación inversa con Nominatim...`)
  console.log(`   ⏱  ${puntos.length} puntos × 1.1s = ~${Math.round(puntos.length * 1.1 / 60)} minutos\n`)

  const enriched = []
  for (let i = 0; i < puntos.length; i++) {
    const punto = puntos[i]
    const coords = parseGeom(punto.geom)
    if (!coords) {
      console.warn(`  [${i+1}/${puntos.length}] ⚠️  Sin coordenadas, omitido: ${punto.id}`)
      continue
    }

    const { road, houseNumber } = await reverseGeocode(coords.lat, coords.lng)

    // Generar ID luminaria: Led_SanMartin1550
    const streetNorm = normalizeStreet(road)
    const numStr = houseNumber || String(1000 + i)  // Fallback: altura incremental
    const idLuminaria = `Led_${streetNorm}${numStr}`
    const direccion = houseNumber ? `${road} ${houseNumber}` : road
    const estadoBase = ESTADO_BASE_OPTIONS[Math.random() < 0.75 ? 0 : 1] // 75% en buenas condiciones

    enriched.push({
      id: punto.id,
      nombre: idLuminaria,
      tipo_luminaria: 'LED 150W',
      direccion: direccion,
      barrio_nombre: BARRIO_NOMBRE,
      estado_base: estadoBase,
      sin_luz: false
    })

    const progress = `[${String(i+1).padStart(3,' ')}/${puntos.length}]`
    console.log(`  ${progress} ✅ ${idLuminaria} — ${direccion}`)
    await sleep(NOMINATIM_DELAY_MS)
  }

  console.log(`\n✅ Geocodificación completada: ${enriched.length} puntos enriquecidos.\n`)

  // 5. Actualizar en Supabase
  console.log('⬆️  Actualizando Supabase...')
  let successCount = 0
  let errorCount = 0

  for (const punto of enriched) {
    const { error } = await supabaseWrite
      .from('puntos_relevamiento')
      .update({
        nombre: punto.nombre,
        tipo_luminaria: punto.tipo_luminaria,
        direccion: punto.direccion,
        barrio_nombre: punto.barrio_nombre,
        estado_base: punto.estado_base,
        sin_luz: punto.sin_luz
      })
      .eq('id', punto.id)
    
    if (error) {
      console.error(`  ❌ Error actualizando ${punto.id}: ${error.message}`)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`\n🏁 PROCESO COMPLETADO`)
  console.log(`   ✅ Exitosos: ${successCount}`)
  console.log(`   ❌ Errores:  ${errorCount}`)
  console.log(`   💾 Backup en: ${backupPath}`)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
