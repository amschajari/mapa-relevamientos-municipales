/**
 * Script: enriquecer_san_clemente.cjs
 * Toma el san_clemente_export.csv y agrega datos ficticios realistas
 * para testear el popup completo de luminarias.
 * Ejecutar: node scripts/enriquecer_san_clemente.cjs
 */
const fs = require('fs')
const path = require('path')

const TIPOS = ['LED 50W', 'LED 70W', 'LED 100W', 'LED 150W', 'Sodio 70W', 'Sodio 150W', 'Mercurio 125W']
const ESTADOS_BASE = [
  'Con base en buenas condiciones',
  'Con base en buenas condiciones',
  'Con base en buenas condiciones',
  'Base deteriorada',
  'Sin base',
]

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function sinLuzAleatorio() {
  // ~10% de las luminarias sin luz
  return Math.random() < 0.1 ? 'True' : ''
}

function extraerDireccion(idLuminaria) {
  // Ejemplo: "Led_EntreRios3586" → "Entre Ríos 3586"
  const sinPrefix = idLuminaria.replace(/^Led_|^Sodio_|^Mercurio_/i, '')
  // Insertar espacio antes de los números
  return sinPrefix
    .replace(/([a-záéíóúüñA-ZÁÉÍÓÚÜÑ])(\d)/g, '$1 $2') // Letra seguido de número
    .replace(/(\d)([a-záéíóúüñA-ZÁÉÍÓÚÜÑ])/g, '$1 $2') // Número seguido de letra
    .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase
    .trim()
}

const inputPath = path.join(__dirname, '..', 'san_clemente_export.csv')
const outputPath = path.join(__dirname, '..', 'san_clemente_enriquecido.csv')

const texto = fs.readFileSync(inputPath, 'utf8').replace(/^\ufeff/, '') // strip BOM
const lineas = texto.trim().split('\n')

// Mantener el header original
const header = lineas[0]
const rows = lineas.slice(1).map(linea => {
  // Parsear CSV
  const valores = []
  let actual = '', dentroComillas = false
  for (const char of linea) {
    if (char === '"') dentroComillas = !dentroComillas
    else if (char === ',' && !dentroComillas) { valores.push(actual.trim()); actual = '' }
    else actual += char
  }
  valores.push(actual.trim())

  const idLuminaria = valores[0] || ''
  if (!idLuminaria) return null

  const latOriginal = valores[7]
  const lngOriginal = valores[8]

  const tipo = 'LED 150W'
  const direccion = extraerDireccion(idLuminaria)
  const estadoBase = random(ESTADOS_BASE)
  const sinLuz = sinLuzAleatorio()

  const escape = v => `"${String(v).replace(/"/g, '""')}"`

  return [
    escape(idLuminaria),
    escape(sinLuz),
    escape(tipo),
    escape(direccion),
    escape('San Clemente'),
    escape(estadoBase),
    escape(''),        // Medidor (vacío)
    escape(latOriginal),
    escape(lngOriginal),
  ].join(',')
}).filter(Boolean)

const csv = [header, ...rows].join('\n')
fs.writeFileSync(outputPath, csv, 'utf8')
console.log(`✅ Generado: ${outputPath}`)
console.log(`   Total: ${rows.length} luminarias con datos ficticios`)
console.log(`   Sin luz: ~${Math.round(rows.length * 0.1)} luminarias`)
