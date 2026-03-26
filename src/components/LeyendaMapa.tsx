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
    <div className="hidden sm:block bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-200 max-w-[170px]">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-gray-600" />
        <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Estado Barrios</span>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded shadow-sm shrink-0"
              style={{
                backgroundColor: item.color,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-700 leading-none">{item.label}</p>
              <p className="text-[9px] text-gray-400 truncate">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-start gap-1.5">
          <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] leading-tight text-gray-500 italic">
            Para verlos, actívalos en el panel de capas.
          </p>
        </div>
      </div>
    </div>
  )
}
