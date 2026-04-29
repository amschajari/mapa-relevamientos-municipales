import { 
  Lightbulb, 
  Trees, 
  MapPin,
  Eye,
  EyeOff,
  Layers,
  Map,
  Route
} from 'lucide-react'
import { useMapStore } from '@/stores'

import { cn } from '@/lib/constants'

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
  const { domains, toggleLayer, selectedLayerId, setSelectedLayer } = useMapStore()


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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {domains.map((domain) => {
          const Icon = ICON_MAP[domain.icon] || Map
          
          return (
            <div key={domain.id} className="space-y-2">
              {/* Domain Label */}
              <div className="flex items-center gap-2 px-1 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {domain.name}
                </span>
              </div>

              {/* Layers List */}
              <div className="space-y-1">
                {domain.layers.map((layer) => {
                  const isSelected = selectedLayerId === layer.id
                  
                  return (
                    <div 
                      key={layer.id}
                      className={cn(
                        "group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all border",
                        isSelected 
                          ? "bg-primary-50 border-primary-100 shadow-sm" 
                          : "border-transparent hover:bg-gray-50"
                      )}
                    >
                      {/* Toggle Visibility (Eye) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLayer(layer.id)
                        }}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          layer.visible ? "text-primary-600 bg-white shadow-sm" : "text-gray-300 hover:text-gray-400"
                        )}
                        title={layer.visible ? "Ocultar capa" : "Mostrar capa"}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Layer Name / Selection */}
                      <button
                        onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
                        className={cn(
                          "flex-1 text-left text-xs font-medium truncate",
                          layer.visible ? "text-gray-900" : "text-gray-400",
                          isSelected && "text-primary-700"
                        )}
                      >
                        {layer.name}
                      </button>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="w-1 h-3 bg-primary-500 rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}