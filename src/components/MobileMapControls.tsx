import { useState, useMemo, useRef, useEffect } from 'react'
import { Menu, X, Check, Navigation2, Info, Map, Flame } from 'lucide-react'
import { useMap, CircleMarker, Popup } from 'react-leaflet'
import { useBarrioStore } from '@/stores/barrioStore'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Marcador pulsante de ubicación del usuario
const UserLocationMarker = ({ position }: { position: [number, number] }) => (
  <>
    <CircleMarker
      center={position}
      radius={18}
      pathOptions={{
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.4,
      }}
    />
    <CircleMarker
      center={position}
      radius={7}
      pathOptions={{
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }}
    >
      <Popup>📍 Tu ubicación actual</Popup>
    </CircleMarker>
  </>
)

// Botón GPS — debe vivir dentro del MapContainer
const GPSButton = ({ onLocate }: { onLocate: (pos: [number, number]) => void }) => {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        map.flyTo(latlng, 17, { animate: true, duration: 1.2 })
        onLocate(latlng)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <button
      onClick={handleLocate}
      title="Mi ubicación"
      className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300',
        locating
          ? 'bg-blue-500 text-white animate-pulse'
          : 'bg-white text-gray-600 hover:bg-gray-50 active:scale-95'
      )}
    >
      <Navigation2 className="w-5 h-5" />
    </button>
  )
}

export const MobileMapControls = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const {
    visibleLayers,
    toggleLayer,
    barrios,
    mapFilters,
    setMapFilter,
    officialPoints,
  } = useBarrioStore()

  // Fecha de última actualización: el created_at más reciente entre los puntos
  const lastUpdate = useMemo(() => {
    if (!officialPoints || officialPoints.length === 0) return null
    const dates = officialPoints
      .map((p: any) => p.created_at || p.updated_at)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
    if (dates.length === 0) return null
    return new Date(Math.max(...dates))
  }, [officialPoints])

  const estadoBaseOptions = [
    { value: 'ok', label: 'En buenas condiciones', color: 'bg-green-500' },
    { value: 'malas', label: 'Deteriorada / Mala', color: 'bg-red-500' },
    { value: 'sin_base', label: 'Sin base', color: 'bg-orange-500' },
  ]

  const toggleEstadoBase = (value: string) => {
    const current = mapFilters.estadosBase || []
    if (current.includes(value)) {
      setMapFilter('estadosBase', current.filter(v => v !== value))
    } else {
      setMapFilter('estadosBase', [...current, value])
    }
  }

  const menuRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (showInfo && infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowInfo(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, showInfo])

  return (
    <>
      {/* Marcador de ubicación en el mapa */}
      {userLocation && <UserLocationMarker position={userLocation} />}

      {/* Menú Hamburguesa — arriba a la derecha */}
      <div ref={menuRef} className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 sm:hidden">
        {isOpen && (
          <div className="mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-56 animate-in fade-in slide-in-from-top-4 duration-200 overflow-y-auto max-h-[80vh]">
            <div className="px-2 py-1.5 border-b border-gray-50 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Capas</span>
            </div>

            <button
              onClick={() => toggleLayer('barrios')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1',
                visibleLayers.barrios ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', visibleLayers.barrios ? 'bg-primary-500' : 'bg-gray-300')} />
                Polígonos
              </div>
              {visibleLayers.barrios && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => toggleLayer('luminarias')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1',
                visibleLayers.luminarias ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', visibleLayers.luminarias ? 'bg-blue-500' : 'bg-gray-300')} />
                Luminarias
              </div>
              {visibleLayers.luminarias && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => toggleLayer('heatmap')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all',
                visibleLayers.heatmap ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                <Flame className={cn('w-4 h-4', visibleLayers.heatmap ? 'text-orange-500' : 'text-gray-300')} />
                Mapa de Calor
              </div>
              {visibleLayers.heatmap && <Check className="w-3.5 h-3.5" />}
            </button>

            <div className="px-2 py-1.5 border-b border-t border-gray-50 my-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filtros</span>
            </div>

            <div className="space-y-3 px-1">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Barrio</label>
                <select
                  value={mapFilters.barrio}
                  onChange={(e) => setMapFilter('barrio', e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="">Todos los barrios</option>
                  {barrios.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Estados de Base</label>
                <div className="space-y-1">
                  {estadoBaseOptions.map(opt => {
                    const isSelected = (mapFilters.estadosBase || []).includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleEstadoBase(opt.value)}
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
          </div>
        )}

        <button
          onClick={() => setIsOpen((v) => !v)}
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300',
            isOpen ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
          title="Filtros y capas"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Columna Inferior Derecha — Info + GPS (solo móvil) */}
      <div className="absolute bottom-8 right-4 z-[1000] sm:hidden flex flex-col items-center gap-2">

        {/* Botón Info con panel flotante absoluto */}
        <div ref={infoRef} className="relative">
          {showInfo && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-64 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-snug">Gestión de Relevamientos Municipales</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">Alejandro Saposnik</p>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Última actualización</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {lastUpdate
                    ? format(lastUpdate, "dd/MM/yy 'a las' HH:mm", { locale: es })
                    : 'Sin datos cargados'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowInfo((v) => !v)}
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300',
              showInfo ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
            title="Información"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Botón GPS */}
        <GPSButton onLocate={setUserLocation} />
      </div>
    </>
  )
}
