import { MapPin, Info } from 'lucide-react'

interface LeyendaItem {
  color: string
  label: string
  description: string
}

const items: LeyendaItem[] = [
  {
    color: '#9ca3af',
    label: 'Pendiente',
    description: 'Sin iniciar',
  },
  {
    color: '#f59e0b',
    label: 'En Progreso',
    description: 'Relevamiento activo',
  },
  {
    color: '#10b981',
    label: 'Completado',
    description: 'Relevamiento finalizado',
  },
  {
    color: '#ef4444',
    label: 'Pausado',
    description: 'Trabajo suspendido',
  },
]

export const LeyendaMapa = () => {
  return (
    <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-800 text-sm">Estado de Barrios</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded border-2 border-white shadow-sm"
              style={{
                backgroundColor: item.color,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Haz clic en un barrio para ver detalles y asignar tareas.
          </p>
        </div>
      </div>
    </div>
  )
}
