import {
  X,
  MapPin,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import type { Barrio } from '@/types'

interface BarrioDetailModalProps {
  barrio: Barrio
  onClose: () => void
}

export const BarrioDetailModal = ({ barrio, onClose }: BarrioDetailModalProps) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'progreso':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'pausado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'Completado'
      case 'progreso':
        return 'En Progreso'
      case 'pausado':
        return 'Pausado'
      default:
        return 'Pendiente'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{barrio.nombre}</h2>
              <p className="text-sm text-gray-500">Barrio ID: {barrio.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Estado badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado actual:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(
                barrio.estado
              )}`}
            >
              {getEstadoLabel(barrio.estado)}
            </span>
          </div>

          {/* Progreso */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progreso del relevamiento</span>
              <span className="font-medium text-gray-800">{barrio.progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  barrio.estado === 'completado'
                    ? 'bg-green-500'
                    : barrio.estado === 'progreso'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${barrio.progreso}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Luminarias</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {barrio.luminariasRelevadas || 0}
              </p>
              <p className="text-xs text-gray-500">de {barrio.luminariasEstimadas || 0} estimadas</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Días activo</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">-</p>
              <p className="text-xs text-gray-500">Sin información</p>
            </div>
          </div>

          {/* Equipo asignado */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Equipo asignado</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 text-center">
                Sin equipo asignado
              </p>
              <button className="w-full mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                + Asignar equipo
              </button>
            </div>
          </div>

          {/* Fechas */}
          {(barrio.fechaInicio || barrio.fechaFin) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Fechas</span>
              </div>
              <div className="space-y-2">
                {barrio.fechaInicio && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Inicio:</span>
                    <span className="text-gray-700">
                      {barrio.fechaInicio.toLocaleDateString()}
                    </span>
                  </div>
                )}
                {barrio.fechaFin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fin:</span>
                    <span className="text-gray-700">
                      {barrio.fechaFin.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
            Ver en mapa
          </button>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
              Editar
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
              Asignar tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
