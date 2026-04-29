import fs from 'fs';

const csv = fs.readFileSync('./src/data/220426_0934.csv', 'utf-8');
const lineas = csv.split('\n').slice(1);

const agentes = {};
const barrios = {};
const agenteDias = {};

lineas.forEach(linea => {
  if (!linea.trim()) return;
  const parts = linea.split(',"');
  if (parts.length < 4) return;
  const barrio = parts[1]?.replace(/"/g, '').trim();
  const fecha = parts[2]?.replace(/"/g, '').trim();
  const agente = parts[3]?.replace(/"/g, '').trim();

  if (agente) {
    agentes[agente] = (agentes[agente] || 0) + 1;
    if (!agenteDias[agente]) agenteDias[agente] = new Set();
    if (fecha) agenteDias[agente].add(fecha.split(' ')[0]);
  }
  if (barrio) {
    barrios[barrio] = (barrios[barrio] || 0) + 1;
  }
});

const primera = '2026-03-18';
const ultima = '2026-04-22';

console.log('═══════════════════════════════════════');
console.log('  BALANCE RELEVAMIENTOS - 22 ABR 2026');
console.log('═══════════════════════════════════════');
console.log(`\nTotal: 937 luminarias`);
console.log(`Período: ${primera} al ${ultima}`);

console.log('\n═══════════════════════════════════════');
console.log('  ESTADÍSTICAS POR AGENTE');
console.log('═══════════════════════════════════════');
console.log('\nAgente                    Total   DíasTra   Prom/Día');
console.log('─'.repeat(50));

Object.entries(agentes).sort((a, b) => b[1] - a[1]).forEach(([a, t]) => {
  const dias = agenteDias[a]?.size || 1;
  const prom = (t / dias).toFixed(1);
  console.log(`${a.padEnd(25)} ${String(t).padStart(5)}   ${String(dias).padStart(5)}   ${prom}`);
});

console.log('\n═══════════════════════════════════════');
console.log('  ESTADÍSTICAS POR BARRIO');
console.log('═══════════════════════════════════════');
console.log('\nBarrio                    Total');
console.log('─'.repeat(30));

Object.entries(barrios).sort((a, b) => b[1] - a[1]).forEach(([b, t]) => {
  console.log(`${b.padEnd(25)} ${String(t).padStart(5)}`);
});