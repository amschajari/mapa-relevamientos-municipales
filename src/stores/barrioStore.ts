import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Barrio, BarrioFeature, EstadoBarrio, TareaRelevamiento } from '@/types'

interface BarrioState {
  // Estado
  barrios: Barrio[]
  tareas: TareaRelevamiento[]
  selectedBarrio: Barrio | null
  isLoading: boolean
  error: string | null

  // Acciones
  setBarrios: (barrios: Barrio[]) => void
  setTareas: (tareas: TareaRelevamiento[]) => void
  setSelectedBarrio: (barrio: Barrio | null) => void
  addBarrio: (barrio: Barrio) => void
  updateBarrio: (id: string, updates: Partial<Barrio>) => void
  updateBarrioProgress: (nombre: string, progress: number) => void
  setBarrioStatus: (nombre: string, status: EstadoBarrio) => void

  // Selectores
  getBarrioByNombre: (nombre: string) => Barrio | undefined
  getBarrioStatus: (nombre: string) => EstadoBarrio
  getBarrioProgress: (nombre: string) => number
  getBarriosByEstado: (estado: EstadoBarrio) => Barrio[]
  getBarriosConTareas: () => Barrio[]

  // Inicialización desde GeoJSON
  initializeFromGeoJSON: (features: BarrioFeature[]) => void
}

export const useBarrioStore = create<BarrioState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      barrios: [],
      tareas: [],
      selectedBarrio: null,
      isLoading: false,
      error: null,

      // Acciones
      setBarrios: (barrios) => set({ barrios }),

      setTareas: (tareas) => set({ tareas }),

      setSelectedBarrio: (barrio) => set({ selectedBarrio: barrio }),

      addBarrio: (barrio) =>
        set((state) => ({
          barrios: [...state.barrios, barrio],
        })),

      updateBarrio: (id, updates) =>
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      updateBarrioProgress: (nombre, progress) =>
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.nombre === nombre
              ? { ...b, progreso: Math.min(100, Math.max(0, progress)) }
              : b
          ),
        })),

      setBarrioStatus: (nombre, status) =>
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.nombre === nombre ? { ...b, estado: status } : b
          ),
        })),

      // Selectores
      getBarrioByNombre: (nombre) =>
        get().barrios.find((b) => b.nombre === nombre),

      getBarrioStatus: (nombre) => {
        const barrio = get().barrios.find((b) => b.nombre === nombre)
        return barrio?.estado || 'pendiente'
      },

      getBarrioProgress: (nombre) => {
        const barrio = get().barrios.find((b) => b.nombre === nombre)
        return barrio?.progreso || 0
      },

      getBarriosByEstado: (estado) =>
        get().barrios.filter((b) => b.estado === estado),

      getBarriosConTareas: () => {
        const barrioIds = new Set(get().tareas.map((t) => t.barrioId))
        return get().barrios.filter((b) => barrioIds.has(b.id))
      },

      // Inicialización desde GeoJSON
      initializeFromGeoJSON: (features) => {
        const existingBarrios = get().barrios

        // Crear nuevos barrios solo si no existen
        const nuevosBarrios: Barrio[] = features
          .filter(
            (f) => !existingBarrios.some((b) => b.nombre === f.properties.Nombre)
          )
          .map((f) => ({
            id: f.properties.fid.toString(),
            nombre: f.properties.Nombre,
            estado: 'pendiente',
            progreso: 0,
          }))

        if (nuevosBarrios.length > 0) {
          set((state) => ({
            barrios: [...state.barrios, ...nuevosBarrios],
          }))
        }
      },
    }),
    {
      name: 'barrio-store',
      partialize: (state) => ({
        barrios: state.barrios,
        tareas: state.tareas,
      }),
    }
  )
)
