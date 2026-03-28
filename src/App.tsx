import { useState, useEffect } from 'react'
import { ControlMap } from './components/ControlMap'
import { Sidebar } from './components/Sidebar'
import { LeyendaMapa } from './components/LeyendaMapa'
import { EstadisticasPanel } from './components/EstadisticasPanel'
import { DashboardView } from './pages/DashboardView'
import { BarriosView } from './pages/BarriosView'
import { EquiposView } from './pages/EquiposView'
import { BarrioDetailModal } from './components/BarrioDetailModal'
import { useBarrioStore } from './stores'
import { supabase } from './lib/supabase'
import barriosGeoJson from './data/barrios-chajari.json'
import type { Barrio } from './types'
import { LoginModal } from './components/LoginModal'
import { ImportadorDatos } from './components/ImportadorDatos'

// Tipos de vista
const VIEWS = {
  DASHBOARD: 'Dashboard',
  MAPA: 'Mapa',
  BARRIOS: 'Barrios',
  EQUIPOS: 'Equipos',
  ESTADISTICAS: 'Estadísticas',
  IMPORTAR_DATOS: 'Importar Datos',
} as const

function App() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { 
    barrios, 
    tareas, 
    selectedBarrio, 
    setSelectedBarrio, 
    setSession,
    fetchBarrios,
    fetchOfficialPoints,
    activeTab,
    setActiveTab
  } = useBarrioStore()

  // Cargar barrios y auth desde Supabase
  useEffect(() => {
    // 1. Cargar barrios
    fetchBarrios().then(() => {
      fetchOfficialPoints()
      setIsLoading(false)
    })

    // 2. Listener de Autenticación
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])
  /* Demo: Simular algunos barrios con progreso
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
  }, [barrios.length, tareas.length, setBarrios]) */

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
                  onEditBarrio={(barrio) => {
                    setSelectedBarrio(barrio)
                    setShowEditModal(true)
                  }}
                />
              )}
            </div>

            {/* Panel lateral derecho - Leyenda + Detalles */}
            <div className="hidden sm:flex absolute top-4 right-4 flex-col items-end space-y-4 z-[1000] pointer-events-none">
              <div className="pointer-events-auto">
                <LeyendaMapa />
              </div>

            </div>
          </div>
        )

      case VIEWS.BARRIOS:
        return (
          <BarriosView
            barrios={barrios}
            onViewOnMap={(barrio) => {
              setSelectedBarrio(barrio)
              setActiveTab(VIEWS.MAPA)
            }}
          />
        )

      case VIEWS.EQUIPOS:
        return <EquiposView />

      case VIEWS.ESTADISTICAS:
        return <EstadisticasPanel barrios={barrios} tareas={tareas} />

      case VIEWS.IMPORTAR_DATOS:
        return <ImportadorDatos />

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
    <div className="h-[100dvh] w-screen flex overflow-hidden bg-gray-50">
      <div className="hidden sm:flex">
        <Sidebar 
          onLoginClick={() => setShowLoginModal(true)}
        />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderContent()}
      </main>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {showEditModal && selectedBarrio && (
        <BarrioDetailModal
          barrio={selectedBarrio}
          onClose={() => setShowEditModal(false)}
          onViewOnMap={(b) => {
            setShowEditModal(false)
            setSelectedBarrio(b)
            setActiveTab(VIEWS.MAPA)
          }}
        />
      )}
    </div>
  )
}

export default App
