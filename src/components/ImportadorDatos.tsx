import { useState, useCallback, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react'
import { useBarrioStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/constants'

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
  const lineas = texto.replace(/\r/g, '').trim().split('\n')
  if (lineas.length < 2) return []
  
  // Parsear cabecera quitando comillas y espacios de forma agresiva
  const cabecera = lineas[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  
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
    
    // Limpieza agresiva de coordenadas (Odoo antepone ')
    const limpiarCoordenada = (str: string) => {
      if (!str) return NaN
      return parseFloat(str.replace(/[^0-9.\-,]/g, '').replace(',', '.'))
    }
    
    const findValueHelper = (keys: string[]) => {
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
  }).filter(r => r.nombre || r.propiedades.direccion || r.barrio) // Solo ignorar filas que estén completamente en blanco
    .map(r => ({ ...r, nombre: r.nombre || '(Sin ID)' }))
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
  const { barrios, fetchOfficialPoints, recalculateBarrioStats, user } = useBarrioStore()
  const [preview, setPreview] = useState<RegistroPreview[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace')
  const [resultado, setResultado] = useState<{ ok: number; err: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState('')
  const [selectedBarrioReset, setSelectedBarrioReset] = useState('')
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
        const texto = (e.target?.result as string).replace(/^\ufeff/, '')
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

  const normalizarNombre = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

  const confirmarImportacion = async () => {
    const validos = preview.filter(r => r.valido)
    if (validos.length === 0) return

    setIsImporting(true)
    let ok = 0
    let err = 0
    const affectedBarrioIds = new Set<string>()

    // 0. Detectar barrios afectados
    const deduplicatedValidos = Object.values(
      validos.reduce((acc, current) => {
        acc[current.nombre] = current
        return acc
      }, {} as Record<string, typeof validos[0]>)
    )

    const nombres = deduplicatedValidos.map(r => r.nombre)

      // 1. Identificar barrios afectados para el modo replace
      deduplicatedValidos.forEach(registro => {
        if (registro.barrio) {
          const nOdoo = normalizarNombre(registro.barrio)
          const found = barrios.find(b => normalizarNombre(b.nombre) === nOdoo)
          if (found) affectedBarrioIds.add(found.id)
        }
      })

      try {
      // 2. Si modo es 'replace', borrar puntos previos de los barrios afectados
      if (importMode === 'replace' && affectedBarrioIds.size > 0) {
        const ids = Array.from(affectedBarrioIds)
        await useBarrioStore.getState().bulkDeleteByBarrios(ids)
      }

    // 3. Buscar existentes en la DB para resolver si es Insert o Update
    const existentesMap = new Map<string, string>()
    const batchSize = 200 // REDUCIDO: Supabase free tiene límites

    for (let i = 0; i < nombres.length; i += batchSize) {
      const batchNames = nombres.slice(i, i + batchSize)
      const { data, error: queryError } = await supabase
        .from('puntos_relevamiento')
        .select('id, nombre')
        .in('nombre', batchNames)

      if (queryError) {
        console.error('[IMPORT] Error buscando existentes:', queryError)
      }

      if (data) {
        data.forEach(e => existentesMap.set(e.nombre, e.id))
      }
    }

      // 3. Separar registros en Updates e Inserts para mantener homogeneidad de columnas en los lotes
      const toInsert: any[] = []
      const toUpdate: any[] = []

      deduplicatedValidos.forEach(registro => {
        let barrio_id: string | null = null
        let barrioNombreFinal: string | null = null

        if (registro.barrio) {
          const nOdoo = normalizarNombre(registro.barrio)
          const found = barrios.find(
            b => normalizarNombre(b.nombre) === nOdoo
          )
          if (found) {
            barrio_id = found.id
            barrioNombreFinal = found.nombre
          }
        }

        // Si no se pudo asociar a un barrio, la DB lo va a rechazar (not-null constraint).
        // Lo sumamos a los errores y saltamos al siguiente registro sin enviarlo en el lote.
        if (!barrio_id) {
          console.warn(`Punto omitido - Barrio "${registro.barrio}" no encontrado para: ${registro.nombre}`)
          err++
          return
        }
        
        const propertiesFlatten = {
          direccion: registro.propiedades.direccion || '',
          barrio_nombre: barrioNombreFinal || registro.barrio || '',
          estado_base: registro.propiedades.estado_base || '',
          tipo_luminaria: registro.propiedades.tipo || '',
          sin_luz: String(registro.propiedades.sin_luz).toLowerCase() === 'true' || (registro.propiedades.sin_luz as any) === true,
          cableado: registro.propiedades.cableado || ''
        }

        const propiedades = {
          ...registro.propiedades,
          barrio_odoo: registro.barrio,
          barrio: barrioNombreFinal || registro.barrio
        }

        const pointData = {
          barrio_id,
          geom: `POINT(${registro.lng} ${registro.lat})`,
          nombre: registro.nombre,
          ...propertiesFlatten,
          propiedades,
          creado_por: user?.id
        }

        const existingId = existentesMap.get(registro.nombre)
        if (existingId) {
          toUpdate.push({ id: existingId, ...pointData })
        } else {
          toInsert.push(pointData)
        }
      })

    // 4. Ejecutar Bulk Insert y Bulk Update por separado para no mezclar esquemas de objetos
    const insertBatchSize = 100 // Más pequeño para evitar timeouts
    for (let i = 0; i < toInsert.length; i += insertBatchSize) {
      const batch = toInsert.slice(i, i + insertBatchSize)
      const { error } = await supabase.from('puntos_relevamiento').insert(batch)
      if (error) {
        console.error('[IMPORT] Bulk insert error:', error);
        err += batch.length
      }
      else ok += batch.length
    }

    const updateBatchSize = 100
    for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
      const batch = toUpdate.slice(i, i + updateBatchSize)
      const { error } = await supabase.from('puntos_relevamiento').upsert(batch)
      if (error) {
        console.error('[IMPORT] Bulk update error:', error);
        err += batch.length
      }
      else ok += batch.length
    }

      // Recalcular estadísticas
      if (affectedBarrioIds.size > 0) {
        await recalculateBarrioStats(Array.from(affectedBarrioIds))
      }
      await fetchOfficialPoints()
      
    } catch (error) {
      console.error("Error fatal en importación:", error)
      setError("Error crítico durante la importación.")
    } finally {
      setIsImporting(false)
      // Mostramos la cantidad de deductados como OK. Si la UI decía 72 y cargó 71, acá aparecerá 71 OK.
      setResultado({ ok, err })
      setPreview([])
      setNombreArchivo(null)
    }
  }

  const limpiar = () => {
    setPreview([])
    setNombreArchivo(null)
    setResultado(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validosPreview = preview.filter(r => r.valido)
  const invalidosPreview = preview.filter(r => !r.valido)
  const previewParaMostrar = [...invalidosPreview, ...validosPreview].slice(0, 50)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary-600" />
            Importar Luminarias
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Soporta archivos <strong>.csv</strong> de Odoo y <strong>.geojson</strong> / <strong>.json</strong>.
          </p>
        </div>

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

        {error && (
          <div className="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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

        {preview.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-800 text-sm">{nombreArchivo}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  {validosPreview.length} válidos
                </span>
                {invalidosPreview.length > 0 && (
                  <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                    {invalidosPreview.length} con errores
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
                    {previewParaMostrar.map((r, i) => (
                      <tr key={i} className={r.valido ? '' : 'bg-red-50'}>
                        <td className="p-2 font-mono text-gray-800">{r.nombre}</td>
                        <td className="p-2 text-gray-600">{r.barrio || <span className="text-gray-400">—</span>}</td>
                        <td className="p-2 text-gray-600">{isNaN(r.lat) ? '—' : r.lat.toFixed(5)}</td>
                        <td className="p-2 text-gray-600">{isNaN(r.lng) ? '—' : r.lng.toFixed(5)}</td>
                        <td className="p-2">
                          {r.valido 
                            ? <span className="text-green-600">✔</span>
                            : <span className="text-red-500 font-medium" title={r.error}>✘ {r.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 bg-primary-50/50 border-y border-primary-100">
              <label className="text-sm font-semibold text-primary-900 block mb-2">Modo de Importación</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setImportMode('replace')}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 transition-all text-left",
                    importMode === 'replace' 
                      ? "border-primary-500 bg-white shadow-sm ring-2 ring-primary-500/20" 
                      : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100"
                  )}
                >
                  <p className="font-bold text-sm text-primary-700">Reemplazar Barrios (Default)</p>
                  <p className="text-[11px] leading-tight mt-0.5">Limpia las luminarias viejas de los barrios incluidos e inserta las nuevas.</p>
                </button>
                <button
                  onClick={() => setImportMode('merge')}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 transition-all text-left",
                    importMode === 'merge' 
                      ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20" 
                      : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100"
                  )}
                >
                  <p className="font-bold text-sm text-amber-700">Mezclar (Update/Insert)</p>
                  <p className="text-[11px] leading-tight mt-0.5">Suma los puntos nuevos y actualiza los existentes sin borrar nada previo.</p>
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={limpiar}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarImportacion}
                disabled={isImporting || validosPreview.length === 0}
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
                    Importar {validosPreview.length} puntos
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Formato CSV esperado (Odoo):</p>
          <p className="font-mono text-[10px] bg-white/60 rounded p-2">
            "ID Luminaria","Sin Luz","Tipo Luminaria","Dirección","Barrio","Estado de la base","Medidor","Latitud","Longitud","Tipo de Cableado"
          </p>
          <p className="text-blue-700 text-xs mt-1">
            El importador detecta automáticamente el formato y asigna el barrio por nombre.
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-8 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Zona de Peligro: Reiniciar Datos
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Acciones permanentes de limpieza de base de datos.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Reinicio por Barrio */}
              <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-red-100">
                <label className="text-xs font-bold text-red-800 uppercase tracking-wider">Reiniciar Barrio Específico</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm bg-white text-gray-800"
                    value={selectedBarrioReset}
                    onChange={(e) => setSelectedBarrioReset(e.target.value)}
                  >
                    <option value="" disabled>Seleccionar barrio...</option>
                    {barrios.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedBarrioReset}
                    onClick={() => {
                      useBarrioStore.getState().resetOfficialPoints(selectedBarrioReset)
                      setSelectedBarrioReset('')
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              {/* Reinicio Global */}
              <div className="flex flex-col gap-2 p-3 bg-red-100/50 rounded-lg border border-red-200">
                <label className="text-xs font-bold text-red-900 uppercase tracking-wider">Limpieza Global (TODO EL MAPA)</label>
                <p className="text-[10px] text-red-700 leading-tight mb-1">
                  Escribe <span className="font-black underline">BORRAR</span> para habilitar el botón de eliminación total.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe BORRAR..."
                    className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-sm"
                    value={confirmDeleteAll}
                    onChange={(e) => setConfirmDeleteAll(e.target.value)}
                  />
                  <button
                    disabled={confirmDeleteAll !== 'BORRAR'}
                    onClick={() => {
                      useBarrioStore.getState().clearAllOfficialPoints()
                      setConfirmDeleteAll('')
                    }}
                    className="px-4 py-2 bg-red-900 text-white rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50"
                  >
                    ELIMINAR TODO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
