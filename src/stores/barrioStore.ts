import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Barrio, BarrioFeature, EstadoBarrio, TareaRelevamiento } from '@/types'

interface BarrioState {
  // Estado
  barrios: Barrio[]
  tareas: TareaRelevamiento[]
  selectedBarrio: Barrio | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchBarrios: () => Promise<void>
  setBarrios: (barrios: Barrio[]) => void
  setTareas: (tareas: TareaRelevamiento[]) => void
  setSelectedBarrio: (barrio: Barrio | null) => void
  addBarrio: (barrio: Barrio) => void
  updateBarrio: (id: string, updates: Partial<Barrio>) => Promise<void>
  updateBarrioProgress: (nombre: string, progress: number) => Promise<void>
  setBarrioStatus: (nombre: string, status: EstadoBarrio) => Promise<void>

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

      // Fetch barrios desde Supabase
      fetchBarrios: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('barrios')
            .select('*')
            .order('nombre')

          if (error) throw error

          // Si hay datos en Supabase, usarlos
          if (data && data.length > 0) {
            const barriosMapeados: Barrio[] = data.map((b: any) => ({
              id: b.id,
              nombre: b.nombre,
              estado: b.estado || 'pendiente',
              progreso: b.progreso || 0,
              luminariasEstimadas: b.luminarias_estimadas,
              luminariasRelevadas: b.luminarias_relevadas,
              fechaInicio: b.fecha_inicio ? new Date(b.fecha_inicio) : undefined,
              fechaFin: b.fecha_fin ? new Date(b.fecha_fin) : undefined,
              observaciones: b.observaciones,
            }))
            set({ barrios: barriosMapeados, isLoading: false })
          } else {
            // Si no hay datos, inicializar vacío
            set({ isLoading: false })
          }
        } catch (error: any) {
          console.error('Error fetching barrios:', error)
          set({ error: error.message, isLoading: false })
        }
      },

      setBarrios: (barrios) => set({ barrios }),

      setTareas: (tareas) => set({ tareas }),

      setSelectedBarrio: (barrio) => set({ selectedBarrio: barrio }),

      addBarrio: (barrio) =>
        set((state) => ({
          barrios: [...state.barrios, barrio],
        })),

      updateBarrio: async (id, updates) => {
        // Actualizar local
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }))

        // Sincronizar con Supabase
        try {
          const { error } = await supabase
            .from('barrios')
            .update({
              nombre: updates.nombre,
              estado: updates.estado,
              progreso: updates.progreso,
              luminarias_estimadas: updates.luminariasEstimadas,
              luminarias_relevadas: updates.luminariasRelevadas,
              observaciones: updates.observaciones,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)

          if (error) throw error
        } catch (error: any) {
          console.error('Error updating barrio:', error)
          set({ error: error.message })
        }
      },

      updateBarrioProgress: async (nombre, progress) => {
        const barrio = get().barrios.find((b) => b.nombre === nombre)
        if (!barrio) return

        const newProgress = Math.min(100, Math.max(0, progress))
        const estado: EstadoBarrio = newProgress >= 100 ? 'completado' : newProgress > 0 ? 'progreso' : 'pendiente'

        // Actualizar local
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.nombre === nombre
              ? { ...b, progreso: newProgress, estado }
              : b
          ),
        }))

        // Sincronizar con Supabase
        try {
          const { error } = await supabase
            .from('barrios')
            .update({
              progreso: newProgress,
              estado,
              updated_at: new Date().toISOString(),
            })
            .eq('nombre', nombre)

          if (error) throw error
        } catch (error: any) {
          console.error('Error updating progress:', error)
        }
      },

      setBarrioStatus: async (nombre, status) => {
        // Actualizar local
        set((state) => ({
          barrios: state.barrios.map((b) =>
            b.nombre === nombre ? { ...b, estado: status } : b
          ),
        }))

        // Sincronizar con Supabase
        try {
          const { error } = await supabase
            .from('barrios')
            .update({
              estado: status,
              updated_at: new Date().toISOString(),
            })
            .eq('nombre', nombre)

          if (error) throw error
        } catch (error: any) {
          console.error('Error updating status:', error)
        }
      },

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

      // Inicialización desde GeoJSON (solo si no hay datos en Supabase)
      initializeFromGeoJSON: (features) => {
        const existingBarrios = get().barrios

        // Solo crear si no hay barrios en Supabase
        if (existingBarrios.length > 0) return

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
