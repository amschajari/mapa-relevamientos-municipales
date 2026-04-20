import { useState, useCallback, useRef } from 'react'
import { UploadCloud, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import area from '@turf/area'

interface EspacioVerdePreview {
  fid: number
  nombre: string
  areaHa: number
  valido: boolean
  estado: 'nuevo' | 'actualizar'
  error?: string
}

export const ImportadorEspaciosVerdes = () => {
  const [preview, setPreview] = useState<EspacioVerdePreview[]>([])
  const [featuresList, setFeaturesList] = useState<any[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number; errores: string[] } | null>(null)
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

        const registros: EspacioVerdePreview[] = []
        const validFeatures: any[] = []

        features.forEach((f: any) => {
          const props = f.properties || {}
          const fid = props.fid
          const nombre = props.Nombre || null

          if (!fid) {
            registros.push({
              fid: fid || 0,
              nombre: nombre || 'Sin nombre',
              areaHa: 0,
              valido: false,
              estado: 'nuevo',
              error: 'Sin FID'
            })
            return
          }

          let areaHa = 0
          try {
            const areaM2 = area(f)
            areaHa = Math.round((areaM2 / 10000) * 100) / 100
          } catch (err) {
            console.error('Error calculando área:', err)
          }

          registros.push({
            fid,
            nombre: nombre || `Espacio Verde ${fid}`,
            areaHa,
            valido: true,
            estado: 'nuevo'
          })
          validFeatures.push(f)
        })

        setPreview(registros)
        setFeaturesList(validFeatures)
        setShowPreview(true)
      } catch (err: any) {
        setErrorGlobal(err.message || 'Error al procesar el archivo')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.geojson') || file.name.endsWith('.json'))) {
      procesarArchivo(file)
    } else {
      setErrorGlobal('Por favor subir un archivo GeoJSON válido')
    }
  }, [procesarArchivo])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      procesarArchivo(file)
    }
  }, [procesarArchivo])

  const handleImport = async () => {
    if (!featuresList.length) return

    setIsImporting(true)
    const resultado = { creados: 0, actualizados: 0, errores: [] as string[] }

    try {
      // Obtener espacios existentes para comparar
      const { data: existentes } = await supabase
        .from('espacios_verdes')
        .select('fid, nombre')
      
      const fidsExistentes = new Set(existentes?.map(e => e.fid) || [])

        for (const feature of featuresList) {
          const props = feature.properties || {}
          const fid = props.fid as number
          const nombre = (props.Nombre as string) || `Espacio Verde ${fid}`
          
          try {
            const geometry = feature.geometry

            const { error } = await supabase.rpc('upsert_espacio_verde', {
              p_fid: fid,
              p_nombre: nombre,
              p_geom: geometry
            })

            if (error) throw error

            if (fidsExistentes.has(fid)) {
              resultado.actualizados++
            } else {
              resultado.creados++
            }
          } catch (err: any) {
            resultado.errores.push(`FID ${fid}: ${err.message}`)
          }
        }

      setResultado(resultado)
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al importar')
    } finally {
      setIsImporting(false)
    }
  }

  const handleLimpiar = () => {
    setPreview([])
    setFeaturesList([])
    setNombreArchivo(null)
    setResultado(null)
    setErrorGlobal(null)
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Área de Drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
        <p className="text-gray-600 mb-2">
          Arrastrá el archivo GeoJSON de Espacios Verdes
        </p>
        <p className="text-xs text-gray-400 mb-4">
          o hacé clic para seleccionar
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json"
          onChange={handleFileSelect}
          className="hidden"
          id="espacios-verdes-input"
        />
        <label
          htmlFor="espacios-verdes-input"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-sm font-medium"
        >
          Seleccionar Archivo
        </label>
      </div>

      {/* Error Global */}
      {errorGlobal && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-sm text-red-600">{errorGlobal}</p>
          </div>
          <button onClick={() => setErrorGlobal(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Preview */}
      {showPreview && preview.length > 0 && !resultado && (
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">{nombreArchivo}</span>
              <span className="text-sm text-gray-400">({preview.length} registros)</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLimpiar}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Limpiar
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
              >
                {isImporting ? (
                  <>Importando...</>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Importar a Supabase
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">FID</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Nombre</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Área (Ha)</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 50).map((item, idx) => (
                  <tr key={idx} className={!item.valido ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-mono text-xs">{item.fid}</td>
                    <td className="px-4 py-2">{item.nombre || '-'}</td>
                    <td className="px-4 py-2 text-right">{item.areaHa.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      {item.valido ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          {item.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="text-center py-2 text-xs text-gray-400">
                Mostrando 50 de {preview.length} registros
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-800">Importación completada</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{resultado.creados}</p>
              <p className="text-gray-500">Creados</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{resultado.actualizados}</p>
              <p className="text-gray-500">Actualizados</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{resultado.errores.length}</p>
              <p className="text-gray-500">Errores</p>
            </div>
          </div>
          {resultado.errores.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-2">Errores:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {resultado.errores.slice(0, 5).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
                {resultado.errores.length > 5 && (
                  <li>...y {resultado.errores.length - 5} más</li>
                )}
              </ul>
            </div>
          )}
          <button
            onClick={handleLimpiar}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
