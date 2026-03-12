import { useState } from 'react'
import { 
  X, 
  Users, 
  Calendar, 
  AlertCircle,
  Plus
} from 'lucide-react'
import type { Barrio, TareaRelevamiento, EstadoTarea } from '@/types'
import { useBarrioStore } from '@/stores/barrioStore'

interface TaskAssignmentModalProps {
  barrio: Barrio
  onClose: () => void
}

// Mock de equipos para la demostración
const MOCK_EQUIPOS = [
  { id: 'eq-1', nombre: 'Equipo A (Zona Norte)' },
  { id: 'eq-2', nombre: 'Equipo B (Zona Sur)' },
  { id: 'eq-3', nombre: 'Equipo C (Mantenimiento)' },
]

export const TaskAssignmentModal = ({ barrio, onClose }: TaskAssignmentModalProps) => {
  const { addTarea, updateBarrio } = useBarrioStore()
  const [equipoId, setEquipoId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipoId) {
      setError('Por favor seleccione un equipo')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const nuevaTarea: TareaRelevamiento = {
        id: crypto.randomUUID(),
        tipo: 'Barrio',
        nombre: `Relevamiento ${barrio.nombre}`,
        estado: 'Pendiente' as EstadoTarea,
        progreso: 0,
        asignadoA: [equipoId], // En este MVP asignamos a un equipo/id
        barrioId: barrio.id,
        luminariasEstimadas: barrio.luminariasEstimadas || 0,
        luminariasRelevadas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creadoPor: 'Admin', // Placeholder
        fechaInicio: new Date(fechaInicio),
      }

      await addTarea(nuevaTarea)
      
      // Actualizar estado del barrio a 'progreso' si estaba 'pendiente'
      if (barrio.estado === 'pendiente') {
        await updateBarrio(barrio.id, { estado: 'progreso' })
      }

      onClose()
    } catch (err: any) {
      setError('Error al asignar tarea: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Asignar Tarea</h2>
            <p className="text-sm text-gray-500 mt-1">{barrio.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Equipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Equipo Responsable
            </label>
            <select
              value={equipoId}
              onChange={(e) => setEquipoId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              required
            >
              <option value="">Seleccionar Equipo...</option>
              {MOCK_EQUIPOS.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Inicio Estimada
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Resumen */}
          <div className="p-4 bg-primary-50 rounded-xl">
            <h4 className="text-sm font-bold text-primary-900 mb-2">Resumen del Barrio</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-primary-700 block">Luminarias Estimadas</span>
                <span className="font-bold text-primary-900">{barrio.luminariasEstimadas || 0} u.</span>
              </div>
              <div>
                <span className="text-primary-700 block">Tipo de Tarea</span>
                <span className="font-bold text-primary-900">Relevamiento GIS</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Asignar Tarea
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
