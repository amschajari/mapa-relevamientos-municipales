import { X, Sliders, Info, MapPin, Zap, AlertCircle } from 'lucide-react'
import { useMapStore } from '@/stores'
import { useBarrioStore } from '@/stores/barrioStore'
import { cn, ESTADO_BASE_OPTIONS, FUNCIONAMIENTO_OPTIONS } from '@/lib/constants'

export const LayerSettingsPanel = () => {
  const { selectedLayerId, setSelectedLayer, layers, setLayerOpacity } = useMapStore()
  const { barrios, mapFilters, setMapFilter } = useBarrioStore()

  const layer = layers.find(l => l.id === selectedLayerId)
  if (!layer) return null

  const toggleMapFilter = (key: 'estadosBase' | 'funcionamiento', value: string) => {
    const current = (mapFilters[key] as string[]) || []
    if (current.includes(value)) {
      setMapFilter(key, current.filter(v => v !== value))
    } else {
      setMapFilter(key, [...current, value])
    }
  }

  return (
    <>
    <style>{`
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-ide-panel {
        animation: slideIn 0.2s ease-out forwards;
      }
    `}</style>
    <div className="absolute top-0 left-full ml-2 w-72 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden animate-ide-panel z-50 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sliders className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">{layer.name}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ajustes de Capa</p>
          </div>
        </div>
        <button 
          onClick={() => setSelectedLayer(null)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Descripción */}
        {layer.description && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-normal">{layer.description}</p>
          </div>
        )}

        {/* Control de Opacidad */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opacidad</label>
            <span className="text-xs font-bold text-primary-600">{layer.opacity}%</span>
          </div>
          <input 
            type="range"
            min="0"
            max="100"
            value={layer.opacity}
            onChange={(e) => setLayerOpacity(layer.id, parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        {/* Filtros Específicos (Solo para Luminarias por ahora) */}
        {layer.id === 'luminarias-todas' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Por Barrio */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Por Barrio
              </label>
              <select
                value={mapFilters.barrio || ''}
                onChange={(e) => setMapFilter('barrio', e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              >
                <option value="">Todos los barrios</option>
                {barrios.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            {/* Estado de Base */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Estado de Base
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ESTADO_BASE_OPTIONS.map(opt => {
                  const isSelected = (mapFilters.estadosBase || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMapFilter('estadosBase', opt.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                        isSelected 
                          ? "bg-white border-primary-200 text-gray-900 shadow-sm" 
                          : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? opt.color : "bg-gray-300"
                      )} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Funcionamiento */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> Funcionamiento
              </label>
              <div className="space-y-1.5">
                {FUNCIONAMIENTO_OPTIONS.map(opt => {
                  const isSelected = (mapFilters.funcionamiento || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMapFilter('funcionamiento', opt.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                        isSelected 
                          ? "bg-white border-primary-200 text-gray-900 shadow-sm" 
                          : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? opt.color : "bg-gray-300"
                      )} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-tighter">
          IDERA Style Dashboard • v1.2
        </p>
      </div>
    </div>
    </>
  )
}
