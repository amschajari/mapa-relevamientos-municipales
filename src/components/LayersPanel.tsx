import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  Trees, 
  MapPin,
  Eye,
  EyeOff,
  Layers,
  Map,
  Check,
  Route
} from 'lucide-react'
import { useMapStore } from '@/stores'
import { useBarrioStore } from '@/stores/barrioStore'
import { cn, ESTADO_BASE_OPTIONS, FUNCIONAMIENTO_OPTIONS } from '@/lib/constants'

const ICON_MAP: Record<string, React.ElementType> = {
  Lightbulb,
  Trees,
  Route,
  MapPin,
}

interface LayersPanelProps {
  className?: string
}

export const LayersPanel = ({ className }: LayersPanelProps) => {
  const { domains, toggleDomain, toggleLayer, activeBaseMap, setActiveBaseMap } = useMapStore()
  const { barrios, mapFilters, setMapFilter } = useBarrioStore()
  const [baseMapExpanded, setBaseMapExpanded] = useState(false)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false)

  const toggleMapFilter = (key: 'estadosBase' | 'funcionamiento', value: string) => {
    const current = (mapFilters[key] as string[]) || []
    if (current.includes(value)) {
      setMapFilter(key, current.filter(v => v !== value))
    } else {
      setMapFilter(key, [...current, value])
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-600" />
          <h2 className="text-sm font-bold text-gray-900">Capas</h2>
        </div>
      </div>

      {/* Domains & Layers */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {domains.map((domain) => {
          const Icon = ICON_MAP[domain.icon] || Map
          const activeLayers = domain.layers.filter(l => l.visible).length
          
          return (
            <div key={domain.id} className="mb-2">
              {/* Domain Header */}
              <button
                onClick={() => toggleDomain(domain.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {domain.expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-left text-sm font-medium text-gray-700">
                  {domain.name}
                </span>
                {activeLayers > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 rounded-full">
                    {activeLayers}
                  </span>
                )}
              </button>

              {/* Layers */}
              {domain.expanded && (
                <div className="ml-6 mt-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {domain.layers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => {
                        toggleLayer(layer.id)
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all",
                        layer.visible
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5 text-primary-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: layer.style.color || layer.style.fillColor }}
                      />
                      <span className="flex-1 text-left text-xs">{layer.name}</span>
                      {layer.visible && <Check className="w-3 h-3 text-primary-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Filtros de Luminarias */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => setFiltrosExpanded(!filtrosExpanded)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {filtrosExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left text-sm font-medium text-gray-700">Filtros de Luminarias</span>
        </button>

        {filtrosExpanded && (
          <div className="mt-2 ml-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Filtro por Barrio */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Por Barrio
              </label>
              <select
                value={mapFilters.barrio || ''}
                onChange={(e) => setMapFilter('barrio', e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="">Todos los barrios</option>
                {barrios.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado de Base */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Estado de Base
              </label>
              <div className="space-y-1">
                {ESTADO_BASE_OPTIONS.map(opt => {
                  const isSelected = (mapFilters.estadosBase || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMapFilter('estadosBase', opt.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
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

            {/* Filtro por Funcionamiento */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Funcionamiento
              </label>
              <div className="space-y-1">
                {FUNCIONAMIENTO_OPTIONS.map(opt => {
                  const isSelected = (mapFilters.funcionamiento || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMapFilter('funcionamiento', opt.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
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

      {/* Base Map Selector */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => setBaseMapExpanded(!baseMapExpanded)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {baseMapExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <Map className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left text-sm font-medium text-gray-700">Mapa Base</span>
        </button>

        {baseMapExpanded && (
          <div className="grid grid-cols-3 gap-2 mt-2 ml-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => setActiveBaseMap('osm')}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                activeBaseMap === 'osm'
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-8 rounded bg-[url('https://a.tile.openstreetmap.org/12/2048/1287.png')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">OSM</span>
            </button>

            <button
              onClick={() => setActiveBaseMap('osm-dark')}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                activeBaseMap === 'osm-dark'
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-8 rounded bg-[url('https://a.basemaps.cartocdn.com/dark_all/12/2048/1287.png')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">Oscuro</span>
            </button>

            <button
              onClick={() => setActiveBaseMap('satellite')}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                activeBaseMap === 'satellite'
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-8 rounded bg-[url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/18745/12912')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">Satel.</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}