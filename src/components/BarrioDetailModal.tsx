import { useState, useEffect } from 'react'
import { 
  X, 
  MapPin, 
  Save, 
  Edit2, 
  AlertCircle, 
  Map as MapIcon, 
  ClipboardList 
} from 'lucide-react'
import type { Barrio, EstadoBarrio } from '@/types'
import { useBarrioStore } from '@/stores'
import { TaskAssignmentModal } from './TaskAssignmentModal'

interface BarrioDetailModalProps {
  barrio: Barrio
  onClose: () => void
  onViewOnMap?: (barrio: Barrio) => void
}

export const BarrioDetailModal = ({ 
  barrio: initialBarrio, 
  onClose,
  onViewOnMap,
}: BarrioDetailModalProps) => {
  const { updateBarrio } = useBarrioStore()
// ... (rest of states and handleSave same as before)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)

  const [editData, setEditData] = useState({
    estado: initialBarrio.estado,
    progreso: initialBarrio.progreso,
    observaciones: initialBarrio.observaciones || '',
    luminariasEstimadas: initialBarrio.luminariasEstimadas || 0,
    luminariasRelevadas: initialBarrio.luminariasRelevadas || 0,
  })

  useEffect(() => {
    setEditData({
      estado: initialBarrio.estado,
      progreso: initialBarrio.progreso,
      observaciones: initialBarrio.observaciones || '',
      luminariasEstimadas: initialBarrio.luminariasEstimadas || 0,
      luminariasRelevadas: initialBarrio.luminariasRelevadas || 0,
    })
  }, [initialBarrio])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await updateBarrio(initialBarrio.id, {
        estado: editData.estado,
        progreso: editData.progreso,
        observaciones: editData.observaciones,
        luminariasEstimadas: editData.luminariasEstimadas,
        luminariasRelevadas: editData.luminariasRelevadas,
      })
      setIsEditing(false)
    } catch (err: any) {
      setError('Error al guardar los cambios. Intente nuevamente.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 border-green-200'
      case 'progreso': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'pausado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'completado': return 'Completado'
      case 'progreso': return 'En Progreso'
      case 'pausado': return 'Pausado'
      default: return 'Pendiente'
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{initialBarrio.nombre}</h2>
              <p className="text-sm text-gray-500">Barrio ID: {initialBarrio.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              {!isEditing ? (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(initialBarrio.estado)}`}>
                  {getEstadoLabel(initialBarrio.estado)}
                </span>
              ) : (
                <select
                  value={editData.estado}
                  onChange={(e) => setEditData({ ...editData, estado: e.target.value as EstadoBarrio })}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Progreso del relevamiento</span>
              <span className="font-bold text-gray-800">{isEditing ? editData.progreso : initialBarrio.progreso}%</span>
            </div>
            {isEditing ? (
              <input
                type="range" min="0" max="100" value={editData.progreso}
                onChange={(e) => setEditData({ ...editData, progreso: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            ) : (
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    initialBarrio.estado === 'completado' ? 'bg-green-500' : 
                    initialBarrio.estado === 'progreso' ? 'bg-amber-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${initialBarrio.progreso}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Relevadas</span>
              </div>
              {isEditing ? (
                <input
                  type="number" value={editData.luminariasRelevadas}
                  onChange={(e) => setEditData({ ...editData, luminariasRelevadas: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-lg font-bold"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{initialBarrio.luminariasRelevadas || 0}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Estimadas</span>
              </div>
              {isEditing ? (
                <input
                  type="number" value={editData.luminariasEstimadas}
                  onChange={(e) => setEditData({ ...editData, luminariasEstimadas: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-lg font-bold"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{initialBarrio.luminariasEstimadas || 0}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Observaciones:</span>
            </div>
            {isEditing ? (
              <textarea
                value={editData.observaciones}
                onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
                placeholder="Añadir notas sobre este barrio..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic">
                {initialBarrio.observaciones || 'Sin observaciones registradas'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          {!isEditing ? (
            <>
              <button 
                onClick={() => onViewOnMap?.(initialBarrio)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MapIcon className="w-4 h-4" />
                Ver en mapa
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-300 bg-white"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-all"
                >
                  <ClipboardList className="w-4 h-4" />
                  Asignar tarea
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-all shadow-sm shadow-primary-200"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      </div>

      {showTaskModal && (
        <TaskAssignmentModal
          barrio={initialBarrio}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  )
}
