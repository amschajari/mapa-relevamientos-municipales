import { Edit3 } from 'lucide-react'
import { Barrio } from '@/types'
import { useBarrioStore } from '@/stores'

interface BarrioPopupProps {
  barrio: Barrio
  onEdit?: (barrio: Barrio) => void
}

export const BarrioPopup = ({ barrio, onEdit }: BarrioPopupProps) => {
  const { user } = useBarrioStore()
  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente'
      case 'progreso':
        return 'En Progreso'
      case 'completado':
        return 'Completado'
      case 'pausado':
        return 'Pausado'
      default:
        return estado
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'text-green-600 bg-green-100'
      case 'progreso':
        return 'text-amber-600 bg-amber-100'
      case 'pausado':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg text-gray-800">{barrio.nombre}</h3>
        {user?.role === 'admin' && onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(barrio)
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
            title="Editar barrio"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado:</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(barrio.estado)}`}>
            {getStatusLabel(barrio.estado)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Progreso:</span>
          <span className="text-sm font-medium">{barrio.progreso}%</span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              barrio.estado === 'completado'
                ? 'bg-green-500'
                : barrio.estado === 'progreso'
                ? 'bg-amber-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${barrio.progreso}%` }}
          />
        </div>

        {barrio.luminariasRelevadas !== undefined && barrio.luminariasEstimadas && (
          <div className="text-xs text-gray-500 mt-2">
            {barrio.luminariasRelevadas} de {barrio.luminariasEstimadas} luminarias relevadas
          </div>
        )}
      </div>
    </div>
  )
}
