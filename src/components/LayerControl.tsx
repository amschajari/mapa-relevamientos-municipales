import { useState, useRef, useEffect } from 'react';
import { Layers, Check, Flame } from 'lucide-react';
import { useBarrioStore } from '@/stores/barrioStore';
import { useMapStore } from '@/stores';
import { cn } from '@/lib/utils';

export const LayerControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeBaseMap, setActiveBaseMap } = useBarrioStore();
  const { layers, toggleLayer: toggleMapLayer, setActiveBaseMap: setMapBaseMap } = useMapStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const showBarrios = layers.find(l => l.id === 'barrios-poligonos')?.visible ?? false;
  const showLuminarias = layers.find(l => l.id === 'luminarias-todas')?.visible ?? true;
  const showHeatmap = layers.find(l => l.id === 'luminarias-calor')?.visible ?? false;

  // Sincronizar cambio de mapa base
  const handleSetBaseMap = (base: 'osm' | 'osm-dark' | 'satellite') => {
    setActiveBaseMap(base)
    setMapBaseMap(base)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="absolute bottom-8 left-4 z-[1000]">
      {/* Menu */}
      {isOpen && (
        <div className="mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-3 py-2 border-b border-gray-50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capas del Mapa</span>
          </div>
          
          <button
            onClick={() => toggleMapLayer('barrios-poligonos')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              showBarrios 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                showBarrios ? "bg-primary-500" : "bg-gray-300"
              )} />
              Polígonos de Barrios
            </div>
            {showBarrios && <Check className="w-4 h-4" />}
          </button>

          <button
            onClick={() => toggleMapLayer('luminarias-todas')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              showLuminarias 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                showLuminarias ? "bg-blue-500" : "bg-gray-300"
              )} />
              Luminarias (Puntos)
            </div>
            {showLuminarias && <Check className="w-4 h-4" />}
          </button>

          <button
            onClick={() => toggleMapLayer('luminarias-calor')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              showHeatmap 
                ? "bg-orange-50 text-orange-700" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-2">
              <Flame className={cn(
                "w-4 h-4",
                showHeatmap ? "text-orange-500" : "text-gray-300"
              )} />
              Mapa de Calor
            </div>
            {showHeatmap && <Check className="w-4 h-4" />}
          </button>

          {/* Mapas Base */}
          <div className="px-3 py-2 border-b border-t border-gray-50 my-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mapa Base</span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1">
            <button
              onClick={() => handleSetBaseMap('osm')}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                activeBaseMap === 'osm'
                  ? "bg-primary-50 border-primary-100 text-primary-700 shadow-sm"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-10 rounded-lg bg-[url('https://a.tile.openstreetmap.org/12/2048/1287.png')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">OSM</span>
            </button>

            <button
              onClick={() => handleSetBaseMap('osm-dark')}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                activeBaseMap === 'osm-dark'
                  ? "bg-primary-50 border-primary-100 text-primary-700 shadow-sm"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-10 rounded-lg bg-[url('https://a.basemaps.cartocdn.com/dark_all/12/2048/1287.png')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">Oscuro</span>
            </button>

            <button
              onClick={() => handleSetBaseMap('satellite')}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                activeBaseMap === 'satellite'
                  ? "bg-primary-50 border-primary-100 text-primary-700 shadow-sm"
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="w-full h-10 rounded-lg bg-[url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/18745/12912')] bg-cover bg-center border border-gray-200" />
              <span className="text-[10px] font-bold">Satelital</span>
            </button>
          </div>
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
