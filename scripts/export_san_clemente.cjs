/**
 * Script: export_san_clemente.cjs
 * Exporta los puntos de San Clemente a un CSV en formato Odoo.
 * Ejecutar: node scripts/export_san_clemente.cjs
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://elczfqaevdnomwflgvka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function escapeCSV(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  // Escapar comillas dobles y envolver en comillas
  return `"${str.replace(/"/g, '""')}"`
}

function extractCoords(geom) {
  if (!geom) return { lat: '', lng: '' }

  // Formato WKT: POINT(-57.987 -30.758)
  if (typeof geom === 'string' && geom.startsWith('POINT')) {
    const match = geom.match(/POINT\(([^\s]+)\s+([^\)]+)\)/)
    if (match) return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) }
  }

  // Formato GeoJSON object
  if (geom.type === 'Point' && geom.coordinates) {
    return { lat: geom.coordinates[1], lng: geom.coordinates[0] }
  }

  return { lat: '', lng: '' }
}

async function exportar() {
  console.log('Buscando barrio San Clemente...')
  const { data: barrios } = await supabase
    .from('barrios')
    .select('id, nombre')
    .eq('nombre', 'San Clemente')

  if (!barrios || barrios.length === 0) {
    console.error('No se encontró el barrio San Clemente.')
    return
  }

  const barrioId = barrios[0].id
  console.log(`Barrio encontrado: ${barrios[0].nombre} (ID: ${barrioId})`)

  const { data: puntos, error } = await supabase
    .from('puntos_relevamiento')
    .select('id, nombre, geom, propiedades')
    .eq('barrio_id', barrioId)

  if (error) {
    console.error('Error al obtener puntos:', error)
    return
  }

  console.log(`Se encontraron ${puntos.length} puntos. Generando CSV...`)

  const header = '"ID Luminaria","Sin Luz","Tipo Luminaria","Dirección","Barrio","Estado de la base","Medidor","Latitud","Longitud"'

  const rows = puntos.map(p => {
    const props = p.propiedades || {}
    const { lat, lng } = extractCoords(p.geom)
    return [
      escapeCSV(p.nombre),
      escapeCSV(props.sin_luz || ''),
      escapeCSV(props.tipo || props.tipo_luminaria || ''),
      escapeCSV(props.direccion || ''),
      escapeCSV('San Clemente'),
      escapeCSV(props.estado_base || props.estado || ''),
      escapeCSV(props.medidor || ''),
      escapeCSV(lat),
      escapeCSV(lng),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  const outputPath = path.join(__dirname, '..', 'san_clemente_export.csv')
  fs.writeFileSync(outputPath, csv, 'utf8')
  console.log(`\n✅ CSV exportado exitosamente: ${outputPath}`)
  console.log(`   Total de registros: ${rows.length}`)
}

exportar()
