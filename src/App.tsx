import { useState, useEffect } from 'react'
import { ControlMap } from './components/ControlMap'
import { Sidebar } from './components/Sidebar'
import { LeyendaMapa } from './components/LeyendaMapa'
import { EstadisticasPanel } from './components/EstadisticasPanel'
import { DashboardView } from './pages/DashboardView'
import { BarriosView } from './pages/BarriosView'
import { useBarrioStore } from './stores'
import barriosGeoJson from './data/barrios-chajari.json'
import type { Barrio, EstadoBarrio } from './types'

// Tipos de vista
const VIEWS = {
  DASHBOARD: 'Dashboard',
  MAPA: 'Mapa',
  BARRIOS: 'Barrios',
  EQUIPOS: 'Equipos',
  ESTADISTICAS: 'Estadísticas',
  CONFIGURACION: 'Configuración',
} as const

function App() {
  const [activeTab, setActiveTab] = useState<string>(VIEWS.MAPA)
  const [selectedBarrio, setSelectedBarrio] = useState<Barrio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { barrios, tareas, initializeFromGeoJSON, setBarrios, fetchBarrios } = useBarrioStore()

  // Cargar barrios desde Supabase al montar
  useEffect(() => {
    // Primero intentar cargar desde Supabase
    fetchBarrios().then(() => {
      // Si no hay datos en Supabase, usar GeoJSON
      if (barrios.length === 0 && barriosGeoJson?.features) {
        initializeFromGeoJSON(barriosGeoJson.features as any)
      }
      setIsLoading(false)
    })
  }, [])

  // Demo: Simular algunos barrios con progreso
  useEffect(() => {
    if (barrios.length > 0 && tareas.length === 0) {
      // Crear tareas de ejemplo para algunos barrios
      const barriosEjemplo = ['Centro', 'San Clemente', 'Villa Alejandrina']
      const nuevosBarrios: Barrio[] = barrios.map((b) => {
        if (barriosEjemplo.includes(b.nombre)) {
          return {
            ...b,
            estado: b.nombre === 'Centro' ? 'completado' : ('progreso' as EstadoBarrio),
            progreso: b.nombre === 'Centro' ? 100 : Math.floor(Math.random() * 60) + 20,
            luminariasEstimadas: Math.floor(Math.random() * 200) + 50,
            luminariasRelevadas: b.nombre === 'Centro' ? 200 : Math.floor(Math.random() * 50),
          }
        }
        return {
          ...b,
          luminariasEstimadas: Math.floor(Math.random() * 200) + 50,
        }
      })
      setBarrios(nuevosBarrios)
    }
  }, [barrios.length, tareas.length, setBarrios])

  const handleBarrioClick = (barrio: Barrio) => {
    setSelectedBarrio(barrio)
    setActiveTab(VIEWS.MAPA)
  }

  const renderContent = () => {
    switch (activeTab) {
      case VIEWS.DASHBOARD:
        return <DashboardView barrios={barrios} />

      case VIEWS.MAPA:
        return (
          <div className="flex-1 flex relative">
            {/* Mapa */}
            <div className="flex-1 relative">
              {isLoading ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              ) : (
                <ControlMap
                  barriosGeoJson={barriosGeoJson as any}
                  tareas={tareas}
                  onBarrioClick={handleBarrioClick}
                  selectedBarrio={selectedBarrio}
                />
              )}
            </div>

            {/* Panel lateral derecho - Leyenda + Detalles */}
            <div className="absolute top-4 right-4 w-80 space-y-4 z-[1000] pointer-events-none">
              <div className="pointer-events-auto">
                <LeyendaMapa />
              </div>

              {selectedBarrio && (
                <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200 pointer-events-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">{selectedBarrio.nombre}</h3>
                    <button
                      onClick={() => setSelectedBarrio(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`font-medium ${
                        selectedBarrio.estado === 'completado' ? 'text-green-600' :
                        selectedBarrio.estado === 'progreso' ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {selectedBarrio.estado === 'completado' ? 'Completado' :
                         selectedBarrio.estado === 'progreso' ? 'En Progreso' :
                         'Pendiente'}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso:</span>
                      <span className="font-medium">{selectedBarrio.progreso}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          selectedBarrio.estado === 'completado' ? 'bg-green-500' :
                          selectedBarrio.estado === 'progreso' ? 'bg-amber-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${selectedBarrio.progreso}%` }}
                      />
                    </div>

                    {(selectedBarrio.luminariasEstimadas ?? 0) > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Luminarias:</span>
                          <span className="font-medium">
                            {selectedBarrio.luminariasRelevadas || 0} / {selectedBarrio.luminariasEstimadas}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case VIEWS.BARRIOS:
        return <BarriosView barrios={barrios} />

      case VIEWS.ESTADISTICAS:
        return <EstadisticasPanel barrios={barrios} tareas={tareas} />

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Módulo en desarrollo</p>
              <p className="text-sm">Esta sección está siendo implementada</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
