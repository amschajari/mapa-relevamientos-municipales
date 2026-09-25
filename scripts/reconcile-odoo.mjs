#!/usr/bin/env node
/**
 * reconcile-odoo.mjs — Detector de diferencias Odoo ↔ Supabase (mapa).
 *
 * Compara un export CSV de Odoo contra la tabla `puntos_relevamiento` y reporta:
 *   1. FALTAN EN MAPA ..... registros en Odoo que no están en Supabase
 *   2. SOBRAN EN MAPA ...... registros en Supabase que ya no están en Odoo (posibles obsoletos)
 *   3. RECHAZADOS .......... filas que el Importador descartaría (sin ID, coords inválidas,
 *                            barrio desconocido) — la causa más común de diferencias "misteriosas"
 *
 * Replica las reglas del importador (`src/components/ImportadorDatos.tsx`):
 *   - válido = tiene ID + lat/lng numéricas distintas de 0 (Odoo antepone ' a las coords)
 *   - el barrio debe matchear (normalizado, sin tildes) un barrio existente
 *
 * Uso:
 *   node scripts/reconcile-odoo.mjs docs/odoo250926_900.csv
 *   node scripts/reconcile-odoo.mjs docs/odoo250926_900.csv --json reporte.json
 *
 * Credenciales: las lee de `.env.local` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
 * o de las variables de entorno SUPABASE_URL / SUPABASE_ANON_KEY.
 *
 * Exit code: 0 = sin diferencias, 1 = hay diferencias (útil para cron/CI).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// ---------------------------------------------------------------- args/env
const args = process.argv.slice(2).filter(a => !a.startsWith('--json'))
const jsonIdx = process.argv.indexOf('--json')
const jsonOut = jsonIdx !== -1 ? process.argv[jsonIdx + 1] : null
const csvPath = args[0]

if (!csvPath || !existsSync(csvPath)) {
  console.error('Uso: node scripts/reconcile-odoo.mjs <archivo-odoo.csv> [--json reporte.json]')
  process.exit(2)
}

function loadEnv() {
  const env = { ...process.env }
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf-8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}
const env = loadEnv()
const SUPA_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const SUPA_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Faltan credenciales Supabase (SUPABASE_URL / SUPABASE_ANON_KEY o .env.local).')
  process.exit(2)
}

// ---------------------------------------------------------------- csv
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split('\n')
  const head = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = splitLine(l)
    const row = {}
    head.forEach((h, i) => { row[h] = (vals[i] || '').trim() })
    return row
  })
}
function splitLine(line) {
  const out = []
  let cur = '', q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const cleanCoord = s => {
  if (!s) return NaN
  return parseFloat(String(s).replace(/[^0-9.\-,]/g, '').replace(',', '.'))
}
const findCol = (row, keys) => {
  const k = Object.keys(row).find(c => keys.some(x => c.includes(x)))
  return k ? row[k] : ''
}

const rows = parseCSV(readFileSync(csvPath, 'utf-8'))

// ---------------------------------------------------------------- supabase
async function sb(table, select) {
  const out = []
  let off = 0
  for (;;) {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/${table}?select=${select}&order=id&offset=${off}&limit=1000`,
      { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } }
    )
    if (!r.ok) throw new Error(`Supabase ${table}: HTTP ${r.status}`)
    const b = await r.json()
    if (!b.length) break
    out.push(...b); off += b.length
    if (b.length < 1000) break
  }
  return out
}
const puntos = await sb('puntos_relevamiento', 'nombre,odoo_id,barrio_id')
const barrios = await sb('barrios', 'id,nombre')
const barriosNorm = new Set(barrios.map(b => norm(b.nombre)))

// ---------------------------------------------------------------- análisis
const byId = new Map()       // nombre -> fila (dedup como el importador: gana la última)
const sinId = []
const coordInvalidas = []
const barrioDesconocido = []
for (const r of rows) {
  const id = (r['id luminaria'] || findCol(r, ['id luminaria', 'id'])).trim()
  if (!id) { sinId.push(r); continue }
  byId.set(id, r)
}
for (const [id, r] of byId) {
  const lat = cleanCoord(r['latitud'] || findCol(r, ['latitud', 'lat']))
  const lng = cleanCoord(r['longitud'] || findCol(r, ['longitud', 'lng']))
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) { coordInvalidas.push(id); continue }
  const b = r['barrio'] || findCol(r, ['barrio'])
  if (b && !barriosNorm.has(norm(b))) barrioDesconocido.push({ id, barrio: b })
}
const odooIds = [...new Set([...rows.map(r => (r['id luminaria'] || '').trim())].filter(Boolean))]
const dups = rows.length - byId.size - sinId.length

const dbNombres = new Set(puntos.map(p => p.nombre))
const faltan = odooIds.filter(id => !dbNombres.has(id))
const sobran = puntos.map(p => p.nombre).filter(n => n && !byId.has(n))

const detalleFaltan = faltan.map(id => {
  const r = byId.get(id) || {}
  return {
    id,
    barrio: r['barrio'] || findCol(r, ['barrio']) || '',
    direccion: findCol(r, ['dirección', 'direccion', 'calle']) || '',
    causa_probable: coordInvalidas.includes(id) ? 'coordenadas inválidas (el importador la salta en silencio)'
      : barrioDesconocido.some(x => x.id === id) ? 'barrio no matchea (el importador la cuenta como error)'
      : 'nunca importada (no está en ningún archivo importado)'
  }
})

// ---------------------------------------------------------------- salida
console.log('=== RECONCILIACIÓN ODOO ↔ MAPA ===')
console.log(`CSV Odoo:          ${csvPath}`)
console.log(`  filas:           ${rows.length} (con ID: ${odooIds.length}, sin ID: ${sinId.length}, dup. por ID: ${dups})`)
console.log(`Supabase:          ${puntos.length} puntos`)
console.log(`Clave de match:    nombre (ID Luminaria)${rows[0] && 'id' in rows[0] ? ' + odoo_id donde existe' : ' — el CSV no trae columna ID numérica'}`)
console.log('')
console.log(`FALTAN EN MAPA:    ${faltan.length}`)
for (const d of detalleFaltan.slice(0, 30))
  console.log(`  - ${d.id} | Barrio: ${d.barrio || '?'} | ${d.direccion} | → ${d.causa_probable}`)
if (faltan.length > 30) console.log(`  ... y ${faltan.length - 30} más (ver --json)`)
console.log(`SOBRAN EN MAPA:    ${sobran.length} (obsoletos a borrar, o más nuevos que el CSV)`)
for (const s of sobran.slice(0, 15)) console.log(`  - ${s}`)
if (sobran.length > 15) console.log(`  ... y ${sobran.length - 15} más (ver --json)`)
console.log(`RECHAZADOS *:      ${coordInvalidas.length} coord. inválidas, ${barrioDesconocido.length} barrio desconocido, ${sinId.length} sin ID`)
console.log('(* filas que el Importador descartaría o contaría como error)')
console.log('')
const ok = faltan.length === 0 && sobran.length === 0
console.log(ok ? '✅ SIN DIFERENCIAS' : '⚠️ HAY DIFERENCIAS (exit 1)')

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({
    fecha: new Date().toISOString(), csv: csvPath,
    resumen: { odoo: odooIds.length, supabase: puntos.length, faltan: faltan.length, sobran: sobran.length },
    faltan_en_mapa: detalleFaltan,
    sobran_en_mapa: sobran,
    rechazados: { coord_invalidas: coordInvalidas, barrio_desconocido: barrioDesconocido, sin_id: sinId.length }
  }, null, 2))
  console.log(`Reporte guardado en ${jsonOut}`)
}
process.exit(ok ? 0 : 1)
