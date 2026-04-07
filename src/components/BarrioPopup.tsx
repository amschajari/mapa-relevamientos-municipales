import { Edit3, Zap, Map, Activity } from 'lucide-react'
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
      case 'pendiente': return 'Pendiente'
      case 'progreso': return 'En Progreso'
      case 'completado': return 'Completado'
      case 'pausado': return 'Pausado'
      default: return estado
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'text-green-700 bg-green-100'
      case 'progreso': return 'text-amber-700 bg-amber-100'
      case 'pausado': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-500 bg-gray-100'
    }
  }

  const relevadas = barrio.luminariasRelevadas || 0
  const superficie = barrio.superficie_ha
  const densidad = superficie && superficie > 0 && relevadas > 0
    ? (relevadas / superficie).toFixed(1)
    : null

  return (
    <div className="p-3 min-w-[210px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base text-gray-900">{barrio.nombre}</h3>
        {user?.role === 'admin' && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(barrio) }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
            title="Editar barrio"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(barrio.estado)}`}>
        {getStatusLabel(barrio.estado)}
      </span>

      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 pr-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Zap className="w-3.5 h-3.5" /> Luminarias encontradas
          </span>
          <span className="font-bold text-gray-800">{relevadas.toLocaleString('es-AR')}</span>
        </div>

        {superficie && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Map className="w-3.5 h-3.5" /> Superficie
            </span>
            <span className="font-medium text-gray-700">{superficie} Ha</span>
          </div>
        )}

        {densidad && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Activity className="w-3.5 h-3.5" /> Densidad
            </span>
            <span className="font-medium text-gray-700">{densidad} lum/Ha</span>
          </div>
        )}
      </div>
    </div>
  )
}
