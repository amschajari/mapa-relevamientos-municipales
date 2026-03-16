import { useState } from 'react';
import { Layers, Check } from 'lucide-react';
import { useBarrioStore } from '@/stores/barrioStore';
import { cn } from '@/lib/utils';

export const LayerControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { visibleLayers, toggleLayer } = useBarrioStore();

  return (
    <div className="absolute bottom-6 left-6 z-[1000]">
      {/* Menu */}
      {isOpen && (
        <div className="mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-3 py-2 border-b border-gray-50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capas del Mapa</span>
          </div>
          
          <button
            onClick={() => toggleLayer('barrios')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              visibleLayers.barrios 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                visibleLayers.barrios ? "bg-primary-500" : "bg-gray-300"
              )} />
              Polígonos de Barrios
            </div>
            {visibleLayers.barrios && <Check className="w-4 h-4" />}
          </button>

          <button
            onClick={() => toggleLayer('luminarias')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              visibleLayers.luminarias 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                visibleLayers.luminarias ? "bg-blue-500" : "bg-gray-300"
              )} />
              Luminarias (Oficial)
            </div>
            {visibleLayers.luminarias && <Check className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
          isOpen 
            ? "bg-primary-600 text-white rotate-90" 
            : "bg-white text-gray-600 hover:bg-gray-50"
        )}
      >
        <Layers className="w-6 h-6" />
      </button>
    </div>
  );
};
