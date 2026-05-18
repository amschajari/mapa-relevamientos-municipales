import { useState, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBarrioStore } from '@/stores/barrioStore';
import { useMapStore } from '@/stores';

export const BaseMapToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeBaseMap, setActiveBaseMap } = useBarrioStore();
  const { setActiveBaseMap: setMapBaseMap } = useMapStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSetBaseMap = (base: 'osm' | 'osm-dark' | 'satellite') => {
    setActiveBaseMap(base);
    setMapBaseMap(base);
  };

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
    <div ref={menuRef} className="absolute bottom-[32px] left-4 z-[1000] flex flex-col">
      {isOpen && (
        <div className="mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-3 py-2 border-b border-gray-50 mb-1">
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
              <span className="text-[10px] font-bold">Claro</span>
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

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
          isOpen
            ? "bg-primary-600 text-white"
            : "bg-white text-gray-600"
        )}
        title="Mapas base"
      >
        <Layers className="w-6 h-6" />
      </button>
    </div>
  );
};