import { useState, useCallback, useRef } from 'react'
import { UploadCloud, CheckCircle, AlertCircle, FileText, X, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import length from '@turf/length'

interface CallePreview {
  fid: number
  nombre: string
  longitudM: number
  valido: boolean
  estado: 'nuevo' | 'actualizar'
  error?: string
}

export const ImportadorCallesPavimentadas = () => {
  const [preview, setPreview] = useState<CallePreview[]>([])
  const [featuresList, setFeaturesList] = useState<any[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace')
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number; eliminados: number; errores: string[] } | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const procesarArchivo = useCallback((file: File) => {
    setResultado(null)
    setErrorGlobal(null)
    setNombreArchivo(file.name)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const texto = (e.target?.result as string).replace(/^\ufeff/, '')
        const geojson = JSON.parse(texto)
        
        const features = geojson.features || (geojson.type === 'Feature' ? [geojson] : [])
        if (!features || features.length === 0) {
          throw new Error('No se encontraron features en el archivo GeoJSON.')
        }

        const registros: CallePreview[] = []
        const validFeatures: any[] = []

        features.forEach((f: any) => {
          const props = f.properties || {}
          const fid = props.fid
          const nombre = props.Nombre || props.nombre || props.name || null

          if (!fid) {
            registros.push({
              fid: fid || 0,
              nombre: nombre || 'Sin nombre',
              longitudM: 0,
              valido: false,
              estado: 'nuevo',
              error: 'Sin FID'
            })
            return
          }

          let longitudM = 0
          try {
            const lengthKm = length(f)
            longitudM = Math.round(lengthKm * 1000 * 100) / 100
          } catch (err) {
            console.error('Error calculando longitud:', err)
          }

          registros.push({
            fid,
            nombre: nombre || `Calle ${fid}`,
            longitudM,
            valido: true,
            estado: 'nuevo'
          })
          validFeatures.push(f)
        })

        setPreview(registros)
        setFeaturesList(validFeatures)
      } catch (err: any) {
        setErrorGlobal('Error al parsear el archivo GeoJSON: ' + err.message)
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
    const errores: string[] = []
    let creados = 0
    let eliminados = 0
    const batchSize = 100 // Lotes de 100

    try {
      // 1. Si modo es 'replace', borrar todos los registros
      if (importMode === 'replace') {
        const { error: deleteError } = await supabase
          .from('calles_pavimentadas')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') //.delete todo
        
        if (deleteError) {
          console.error('Error deleting:', deleteError)
        } else {
          eliminados = preview.length // aproximación
        }
}

      // 2. Verificar existentes en Supabase (solo para merge)
      let fidsExistentes = new Set<number>()
      if (importMode === 'merge') {
        const { data: existentes } = await supabase
          .from('calles_pavimentadas')
          .select('fid')
        
        fidsExistentes = new Set(existentes?.map(e => e.fid) || [])
      }

      // Separar en nuevos y existentes
      const nuevos = importMode === 'replace' 
        ? validos 
        : validos.filter(v => !fidsExistentes.has(v.fid))
      const actualizar = validos.filter(v => fidsExistentes.has(v.fid))

      // Bulk insert de nuevos en lotes
      for (let i = 0; i < nuevos.length; i += batchSize) {
        const lote = nuevos.slice(i, i + batchSize)
        const toInsert = lote.map(calle => {
          const feature = featuresList.find(f => f.properties.fid === calle.fid)
          return {
            fid: calle.fid,
            nombre: calle.nombre,
            geom: feature?.geometry,
            longitud_m: calle.longitudM
          }
        }).filter(c => c.geom)

        const { error } = await supabase
          .from('calles_pavimentadas')
          .insert(toInsert)

        if (error) {
          errores.push(`Error en lote ${i/batchSize + 1}: ${error.message}`)
        } else {
          creados += lote.length
        }
      }

      // Bulk update de existentes (solo datos, no geometría)
      for (const calle of actualizar) {
        const { error } = await supabase
          .from('calles_pavimentadas')
          .update({
            nombre: calle.nombre,
            longitud_m: calle.longitudM
          })
          .eq('fid', calle.fid)

        if (error) {
          errores.push(`Error actualizando ${calle.nombre}: ${error.message}`)
        }
      }

      setResultado({
        creados: nuevos.length - errores.filter(e => e.includes('Error en')).length,
        actualizados: actualizar.length - errores.filter(e => e.includes('actualizando')).length,
        eliminados: eliminados,
        errores
      })
    } catch (err: any) {
      setErrorGlobal('Error durante la importación: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  const limpiar = () => {
    setPreview([])
    setFeaturesList([])
    setNombreArchivo(null)
    setResultado(null)
    setErrorGlobal(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validosPreview = preview.filter(r => r.valido)
  const invalidosPreview = preview.filter(r => !r.valido)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary-600" />
            Importar Calles Pavimentadas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Archivo GeoJSON con líneas de calles pavimentadas (MultiLineString).
          </p>
        </div>

        {resultado && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${resultado.errores.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <CheckCircle className={`w-5 h-5 ${resultado.errores.length === 0 ? 'text-green-600' : 'text-amber-600'}`} />
            <div>
              <p className="font-medium text-gray-800">Importación completada</p>
              <p className="text-sm text-gray-600">
                {resultado.creados} creadas · {resultado.actualizados} actualizadas
              </p>
            </div>
            <button onClick={limpiar} className="ml-auto text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorGlobal && (
          <div className="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{errorGlobal}</p>
            <button onClick={() => setErrorGlobal(null)} className="ml-auto text-red-400 hover:text-red-600">
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
              {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá un archivo GeoJSON o hacé clic para seleccionar'}
            </p>
            <p className="text-sm text-gray-400 mt-1">GeoJSON (.geojson, .json)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json"
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
                  {validosPreview.length} válidas
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
                      <th className="text-left p-2 text-gray-500 font-medium">FID</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Nombre</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Longitud (m)</th>
                      <th className="text-left p-2 text-gray-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0, 50).map((r, i) => (
                      <tr key={i} className={r.valido ? '' : 'bg-red-50'}>
                        <td className="p-2 font-mono text-gray-800">{r.fid}</td>
                        <td className="p-2 text-gray-600">{r.nombre}</td>
                        <td className="p-2 text-gray-600">{r.longitudM} m</td>
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

            <div className="p-4 bg-primary-50/50 border-t border-primary-100">
              <label className="text-sm font-semibold text-primary-900 block mb-2">Modo de Importación</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${
                    importMode === 'replace' 
                      ? "border-primary-500 bg-white shadow-sm ring-2 ring-primary-500/20" 
                      : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <p className="font-bold text-sm text-primary-700">Reemplazar Todo</p>
                  <p className="text-[11px] leading-tight mt-0.5">Borra las calles existentes e importa las nuevas.</p>
                </button>
                <button
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${
                    importMode === 'merge' 
                      ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20" 
                      : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <p className="font-bold text-sm text-amber-700">Mezclar (Update/Insert)</p>
                  <p className="text-[11px] leading-tight mt-0.5">Suma las nuevas y actualiza las existentes.</p>
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
                  'Importar'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}