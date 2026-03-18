import { useState, useCallback, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react'
import { useBarrioStore } from '@/stores'
import { supabase } from '@/lib/supabase'

interface RegistroPreview {
  nombre: string
  lat: number
  lng: number
  barrio: string
  propiedades: Record<string, string>
  valido: boolean
  error?: string
}

function parsearCSV(texto: string): RegistroPreview[] {
  const lineas = texto.trim().split('\n')
  if (lineas.length < 2) return []
  
  // Parsear cabecera quitando comillas
  const cabecera = lineas[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  
  return lineas.slice(1).map(linea => {
    // Parsear CSV respetando comillas
    const valores: string[] = []
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
    
    const fila: Record<string, string> = {}
    cabecera.forEach((h, i) => { fila[h] = valores[i] || '' })
    
    // Limpiar coordenadas (el CSV de Odoo tiene prefijo ')
    const latStr = fila['Latitud']?.replace(/^'/, '').trim()
    const lngStr = fila['Longitud']?.replace(/^'/, '').trim()
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    
    const valido = !!fila['ID Luminaria'] && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    
    return {
      nombre: fila['ID Luminaria'] || '',
      lat,
      lng,
      barrio: fila['Barrio'] || '',
      propiedades: {
        tipo: fila['Tipo Luminaria'] || '',
        estado_base: fila['Estado de la base'] || '',
        sin_luz: fila['Sin Luz'] || '',
        direccion: fila['Dirección'] || '',
        medidor: fila['Medidor'] || '',
      },
      valido,
      error: !fila['ID Luminaria'] ? 'Sin ID' : isNaN(lat) || isNaN(lng) ? 'Coordenadas inválidas' : undefined
    }
  }).filter(r => r.nombre) // Excluir filas vacías
}

function parsearGeoJSON(texto: string): RegistroPreview[] {
  const geojson = JSON.parse(texto)
  const features = geojson.features || (geojson.type === 'Feature' ? [geojson] : [])
  
  return features.map((f: any) => {
    const coords = f.geometry?.coordinates
    const props = f.properties || {}
    const lat = coords?.[1]
    const lng = coords?.[0]
    const valido = !isNaN(lat) && !isNaN(lng)
    
    return {
      nombre: props.Nombre || props.nombre || props.name || props.ID || '',
      lat,
      lng,
      barrio: props.Barrio || props.barrio || '',
      propiedades: props,
      valido,
      error: !valido ? 'Coordenadas inválidas' : undefined
    }
  })
}

export const ImportadorDatos = () => {
  const { barrios, fetchOfficialPoints } = useBarrioStore()
  const { user } = useBarrioStore()
  const [preview, setPreview] = useState<RegistroPreview[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resultado, setResultado] = useState<{ ok: number; err: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Solo disponible para administradores</p>
        </div>
      </div>
    )
  }

  const procesarArchivo = useCallback((file: File) => {
    setResultado(null)
    setError(null)
    setNombreArchivo(file.name)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const texto = (e.target?.result as string).replace(/^\ufeff/, '') // strip BOM
        let registros: RegistroPreview[] = []
        
        if (file.name.endsWith('.csv')) {
          registros = parsearCSV(texto)
        } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
          registros = parsearGeoJSON(texto)
        } else {
          setError('Formato no soportado. Use .csv, .geojson o .json')
          return
        }
        
        if (registros.length === 0) {
          setError('No se encontraron registros válidos en el archivo.')
          return
        }
        
        setPreview(registros)
      } catch (err: any) {
        setError('Error al parsear el archivo: ' + err.message)
      }
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarArchivo(file)
  }, [procesarArchivo])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
  }

  const confirmarImportacion = async () => {
    const validos = preview.filter(r => r.valido)
    if (validos.length === 0) return

    setIsImporting(true)
    let ok = 0
    let err = 0

    for (const registro of validos) {
      // Buscar barrio_id por nombre
      const barrioEncontrado = barrios.find(
        b => b.nombre.toLowerCase() === registro.barrio.toLowerCase()
      )
      
      const { error: insertError } = await supabase
        .from('puntos_relevamiento')
        .insert({
          barrio_id: barrioEncontrado?.id || null,
          geom: `POINT(${registro.lng} ${registro.lat})`,
          nombre: registro.nombre,
          propiedades: registro.propiedades,
          creado_por: user?.id
        })

      if (insertError) {
        err++
      } else {
        ok++
      }
    }

    await fetchOfficialPoints()
    setIsImporting(false)
    setResultado({ ok, err })
    setPreview([])
    setNombreArchivo(null)
  }

  const limpiar = () => {
    setPreview([])
    setNombreArchivo(null)
    setResultado(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validos = preview.filter(r => r.valido)
  const invalidos = preview.filter(r => !r.valido)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary-600" />
            Importar Luminarias
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Soporta archivos <strong>.csv</strong> de Odoo y <strong>.geojson</strong> / <strong>.json</strong>.
          </p>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${resultado.err === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <CheckCircle className={`w-5 h-5 ${resultado.err === 0 ? 'text-green-600' : 'text-amber-600'}`} />
            <div>
              <p className="font-medium text-gray-800">Importación completada</p>
              <p className="text-sm text-gray-600">
                {resultado.ok} puntos importados correctamente
                {resultado.err > 0 && ` · ${resultado.err} con errores`}
              </p>
            </div>
            <button onClick={limpiar} className="ml-auto text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drop Zone */}
        {!preview.length && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragging 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
          >
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
            <p className="text-base font-medium text-gray-700">
              {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá un archivo o hacé clic para seleccionar'}
            </p>
            <p className="text-sm text-gray-400 mt-1">CSV (Odoo), GeoJSON o JSON</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.geojson,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Cabecera del preview */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-800 text-sm">{nombreArchivo}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  {validos.length} válidos
                </span>
                {invalidos.length > 0 && (
                  <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                    {invalidos.length} con errores
                  </span>
                )}
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Ocultar' : 'Ver registros'}
                </button>
                <button onClick={limpiar} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabla de preview */}
            {showPreview && (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-gray-500 font-medium">ID Luminaria</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Barrio</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Latitud</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Longitud</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0, 50).map((r, i) => (
                      <tr key={i} className={r.valido ? '' : 'bg-red-50'}>
                        <td className="p-2 font-mono text-gray-800">{r.nombre}</td>
                        <td className="p-2 text-gray-600">{r.barrio || <span className="text-gray-400">—</span>}</td>
                        <td className="p-2 text-gray-600">{isNaN(r.lat) ? '—' : r.lat.toFixed(5)}</td>
                        <td className="p-2 text-gray-600">{isNaN(r.lng) ? '—' : r.lng.toFixed(5)}</td>
                        <td className="p-2">
                          {r.valido 
                            ? <span className="text-green-600">✔</span>
                            : <span className="text-red-500" title={r.error}>✘ {r.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {preview.length > 50 && (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-gray-400 text-xs">
                          ... y {preview.length - 50} registros más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Acciones */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={limpiar}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarImportacion}
                disabled={isImporting || validos.length === 0}
                className="px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Importar {validos.length} puntos
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Formato CSV esperado (Odoo):</p>
          <p className="font-mono text-xs bg-white/60 rounded p-2">
            "ID Luminaria","Sin Luz","Tipo Luminaria","Dirección","Barrio","Estado de la base","Medidor","Latitud","Longitud"
          </p>
          <p className="text-blue-700 text-xs mt-1">
            El importador detecta automáticamente el formato y limpia los prefijos <code>'</code> en las coordenadas exportadas desde Odoo.
          </p>
        </div>
      </div>
    </div>
  )
}
