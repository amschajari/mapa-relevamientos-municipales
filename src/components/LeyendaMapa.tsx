import { MapPin, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeyendaItem {
  color: string
  label: string
  description: string
}

const barrioItems: LeyendaItem[] = [
  { color: '#9ca3af', label: 'Pendiente', description: 'Sin iniciar' },
  { color: '#f59e0b', label: 'En Progreso', description: 'Relevamiento activo' },
  { color: '#10b981', label: 'Completado', description: 'Relevamiento finalizado' },
  { color: '#ef4444', label: 'Pausado', description: 'Trabajo suspendido' },
]

const luminariaItems: LeyendaItem[] = [
  { color: '#0ea5e9', label: 'Base Buena', description: 'En condiciones' },
  { color: '#ef4444', label: 'Base Mala', description: 'Deteriorada' },
  { color: '#facc15', label: 'Sin Base', description: 'Falta base' },
  { color: '#ef4444', label: 'No enciende', description: 'Condición: Sin luz' },
]

export const LeyendaMapa = () => {
  return (
    <div className="hidden sm:block bg-white/95 backdrop-blur p-4 rounded-[22px] shadow-2xl border border-gray-100 max-w-[210px] animate-in fade-in slide-in-from-right-6 duration-500">
      {/* Sección Barrios */}
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-4 h-4 text-sky-500" />
        <span className="font-extrabold text-sky-600 text-[12px] uppercase tracking-[0.2em] leading-none">Barrios</span>
      </div>

      <div className="space-y-3 mb-6">
        {barrioItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3.5 group">
            <div
              className="w-3.5 h-3.5 rounded-sm shrink-0 transition-transform group-hover:scale-110 shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-[13px] font-black text-gray-700 leading-none">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Sección Luminarias */}
      <div className="flex items-center gap-3 mb-4 pt-5 border-t border-gray-100/50">
        <Lightbulb className="w-4 h-4 text-sky-500" />
        <span className="font-extrabold text-sky-600 text-[12px] uppercase tracking-[0.2em] leading-none">Luminarias</span>
      </div>

      <div className="space-y-3">
        {luminariaItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
              {item.label === 'No enciende' && (
                <div className="absolute inset-0 w-full h-full rounded-full border-2 border-slate-700 shadow-sm" />
              )}
              <div
                className={cn(
                  "rounded-full transition-transform group-hover:scale-110 shadow-md z-10",
                  item.label === 'No enciende' ? 'w-1.5 h-1.5' : 'w-3 h-3'
                )}
                style={{ 
                  backgroundColor: item.color,
                  border: item.label === 'No enciende' ? '1px solid #ffffff' : 'none'
                }}
              />
            </div>
            <p className="text-[13px] font-black text-gray-700 leading-none">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100/50 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 mt-0.5" />
        <p className="text-[10px] leading-snug text-gray-400 italic font-medium">
          Activa las capas para ver los detalles.
        </p>
      </div>
    </div>
  )
}
