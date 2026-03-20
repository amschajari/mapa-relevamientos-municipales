import fs from 'fs';

function parsearCSV(texto) {
  const lineas = texto.trim().split('\n')
  if (lineas.length < 2) return []
  
  // Parsear cabecera quitando comillas y espacios de forma agresiva
  const cabecera = lineas[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  
  return lineas.slice(1).map(linea => {
    // Parsear CSV respetando comillas
    const valores = []
    let actual = ''
    let dentroComillas = false
    for (const char of linea) {
      if (char === '"') {
        dentroComillas = !dentroComillas
      } else if (char === ',' && !dentroComillas) {
        valores.push(actual.trim())
        actual = ''
      } else {
        actual += char
      }
    }
    valores.push(actual.trim())
    
    const fila = {}
    cabecera.forEach((h, i) => { fila[h] = valores[i] || '' })
    
    // Limpieza agresiva de coordenadas (Odoo antepone ')
    const limpiarCoordenada = (str) => {
      if (!str) return NaN
      return parseFloat(str.replace(/[^0-9.\-,]/g, '').replace(',', '.'))
    }
    
    const findValueHelper = (keys) => {
      const foundKey = Object.keys(fila).find(k => 
        keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
      )
      return foundKey ? fila[foundKey] : ''
    }

    const lat = limpiarCoordenada(fila['latitud'] || findValueHelper(['latitud', 'lat']))
    const lng = limpiarCoordenada(fila['longitud'] || findValueHelper(['longitud', 'lng']))
    const valido = !!(fila['id luminaria'] || findValueHelper(['id luminaria', 'id'])) && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0

    return {
      nombre: fila['id luminaria'] || findValueHelper(['id luminaria', 'id']),
      lat,
      lng,
      barrio: fila['barrio'] || findValueHelper(['barrio']),
      propiedades: {
        tipo: fila['tipo luminaria'] || findValueHelper(['tipo', 'tipología']),
        estado_base: fila['estado de la base'] || findValueHelper(['base', 'estado base']),
        sin_luz: fila['sin luz'] || findValueHelper(['sin luz', 'apaga']),
        direccion: fila['dirección'] || findValueHelper(['dirección', 'calle']),
        medidor: fila['medidor'] || findValueHelper(['medidor']),
        cableado: fila['tipo de cableado'] || findValueHelper(['cableado', 'alimenta', 'tipo de cableado']),
      },
      valido,
      error: !fila['id luminaria'] && !findValueHelper(['id luminaria', 'id']) ? 'Sin ID' : (isNaN(lat) || isNaN(lng)) ? 'Coordenadas inválidas' : undefined
    }
  }).filter(r => r.nombre)
}

const texto = fs.readFileSync('docs/odoo-csv/Luminarias_190326_1.csv', 'utf8');
const results = parsearCSV(texto);
console.log('Total validos:', results.filter(r => r.valido).length);
console.log('Result 0 cableado:', results[0].propiedades.cableado);
console.log('Result 10 cableado:', results[10].propiedades.cableado);
