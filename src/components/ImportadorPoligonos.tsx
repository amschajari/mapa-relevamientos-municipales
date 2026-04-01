import { useState, useCallback, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Eye, Map } from 'lucide-react'
import { useBarrioStore } from '@/stores'
import area from '@turf/area'

interface PoligonoPreview {
  nombre: string
  areaHa: number
  valido: boolean
  estado: 'nuevo' | 'actualizar'
  error?: string
}

export const ImportadorPoligonos = () => {
  const { barrios, importarPoligonosBarrios, user } = useBarrioStore()
  const [preview, setPreview] = useState<PoligonoPreview[]>([])
  const [featuresList, setFeaturesList] = useState<any[]>([])
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number; eliminados: number; errores: string[] } | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Barrios que serán eliminados al no estar en el GeoJSON
  const barriosAEliminar = barrios.filter(b => !preview.find(p => p.nombre.toLowerCase() === b.nombre.toLowerCase()))

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

        const registros: PoligonoPreview[] = []
        const validFeatures: any[] = []

        features.forEach((f: any) => {
          const props = f.properties || {}
          const nombre = props.Nombre || props.nombre || props.name || props.ID || ''
          const isPolygon = f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
          
          let areaHa = 0
          if (isPolygon) {
             const areaM2 = area(f)
             areaHa = Math.round((areaM2 / 10000) * 100) / 100
             
             // Normalizamos la propiedad nombre para que quede como "Nombre" para el store
             f.properties = { ...f.properties, Nombre: nombre }
             validFeatures.push(f)
          }

          const existing = barrios.find(b => b.nombre.toLowerCase() === nombre.toLowerCase())

          registros.push({
            nombre: nombre || '(Sin Nombre)',
            areaHa,
            valido: !!nombre && isPolygon,
            estado: existing ? 'actualizar' : 'nuevo',
            error: !nombre ? 'Falta propiedad Nombre' : (!isPolygon ? 'Debe ser Polygon o MultiPolygon' : undefined)
          })
        })

        setPreview(registros)
        setFeaturesList(validFeatures)
      } catch (err: any) {
        setErrorGlobal('Error al parsear el archivo GeoJSON: ' + err.message)
      }
    }
    reader.readAsText(file, 'utf-8')
  }, [barrios])

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

  const limpiar = () => {
    setPreview([])
    setFeaturesList([])
    setNombreArchivo(null)
    setResultado(null)
    setErrorGlobal(null)
    setShowPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmarImportacion = async () => {
    if (featuresList.length === 0) return

    if (!confirm(`Se reemplazarán los polígonos del mapa.\n\nSe agregarán ${preview.filter(p => p.valido && p.estado === 'nuevo').length} barrios nuevos.\nSe actualizarán ${preview.filter(p => p.valido && p.estado === 'actualizar').length} barrios.\nSe eliminarán ${barriosAEliminar.length} barrios (si no tienen puntos).\n\n¿Estás seguro de continuar?`)) {
      return
    }

    setIsImporting(true)
    setErrorGlobal(null)

    try {
      const result = await importarPoligonosBarrios(featuresList)
      setResultado(result)
      
      if (result.errores.length > 0) {
        setErrorGlobal(`Atención: Ocurrieron ${result.errores.length} advertencias/errores durante el proceso.`)
      }
    } catch (err: any) {
      setErrorGlobal('Fallo inesperado durante la importación: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  const validosPreview = preview.filter(r => r.valido)

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-white overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-5 h-5 text-primary-600" />
            Sincronización de Polígonos de Barrios
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Reemplazá los límites (geometría) de los barrios. Se actualizarán las superficies y se eliminarán los barrios que no estén en el archivo (siempre y cuando no tengan luminarias asociadas).
          </p>
        </div>

        {/* Notificaciones */}
        {resultado && (
          <div className="rounded-xl p-4 bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Sincronización completada</p>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>• {resultado.creados} creados</p>
                  <p>• {resultado.actualizados} actualizados</p>
                  <p>• {resultado.eliminados} eliminados</p>
                </div>
                {resultado.errores.length > 0 && (
                  <div className="mt-3 p-2 bg-white rounded border border-red-100 max-h-32 overflow-y-auto">
                    <p className="font-semibold text-red-600 text-xs mb-1">Advertencias:</p>
                    <ul className="text-xs text-red-500 list-disc pl-4 space-y-1">
                      {resultado.errores.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={limpiar} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {errorGlobal && !resultado && (
          <div className="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{errorGlobal}</p>
            <button onClick={() => setErrorGlobal(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Zona de Drop */}
        {!preview.length && !resultado && (
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
              {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá tu archivo GeoJSON aquí'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Solo formato .geojson / .json (Polígonos)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Vista Previa */}
        {preview.length > 0 && !resultado && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 bg-gray-50 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{nombreArchivo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {validosPreview.length} Polígonos
                    </span>
                    {barriosAEliminar.length > 0 && (
                      <span className="text-[10px] font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        -{barriosAEliminar.length} a Eliminar
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={limpiar}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarImportacion}
                  disabled={isImporting || validosPreview.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Sincronizar Mapa
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Fila de Toggles Opcionales */}
            <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar Listado' : 'Ver Detalle Mapeo'}
              </button>
            </div>

            {/* Tabla Detalle */}
            {showPreview && (
               <div className="max-h-72 overflow-y-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50/80 sticky top-0 text-gray-500 text-xs uppercase font-medium">
                     <tr>
                       <th className="px-4 py-3">Barrio (Nombre)</th>
                       <th className="px-4 py-3">Superficie (Ha)</th>
                       <th className="px-4 py-3">Acción Esperada</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {/* Los que se agregan o actualizan */}
                     {preview.map((p, i) => (
                       <tr key={`p-${i}`} className={!p.valido ? 'bg-red-50' : 'hover:bg-gray-50'}>
                         <td className="px-4 py-3 font-medium text-gray-800">
                           {p.nombre}
                           {!p.valido && <span className="block text-xs text-red-500 font-normal">{p.error}</span>}
                         </td>
                         <td className="px-4 py-3 text-gray-600">{p.valido ? p.areaHa.toFixed(2) : '-'}</td>
                         <td className="px-4 py-3">
                           {p.valido ? (
                             p.estado === 'nuevo' 
                               ? <span className="text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1 rounded">NUEVO</span>
                               : <span className="text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">ACTUALIZAR</span>
                           ) : (
                             <span className="text-red-500 text-xs font-bold uppercase tracking-wider">IGNORADO</span>
                           )}
                         </td>
                       </tr>
                     ))}

                     {/* Los que se eliminan */}
                     {barriosAEliminar.map((b, i) => (
                       <tr key={`d-${i}`} className="bg-orange-50/30 line-through text-gray-400">
                          <td className="px-4 py-3 font-medium">{b.nombre}</td>
                          <td className="px-4 py-3">{b.superficie_ha || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="text-orange-600 text-xs font-bold uppercase tracking-wider bg-orange-100 px-2 py-1 rounded no-underline inline-block">ELIMINAR</span>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
            
            {/* Mensaje de Info Extra */}
            <div className="p-4 bg-blue-50/50 text-xs text-blue-800 flex items-start gap-2 border-t border-gray-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <p>
                Los barrios que se marcan para eliminar son los que existen actualmente en la base de datos pero <strong>no han sido encontrados</strong> en el GeoJSON que subiste. Si alguno tiene puntos/luminarias asignados, Supabase bloqueará su eliminación como medida de seguridad.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
