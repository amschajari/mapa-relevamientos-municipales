import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Barrio, BarrioFeature, EstadoBarrio, TareaRelevamiento, JornadaRelevamiento } from '@/types'
import area from '@turf/area'
import { calcularEstimadoAdaptive } from '@/lib/projectionUtils'

interface BarrioState {
  // Estado
  barrios: Barrio[]
  tareas: TareaRelevamiento[]
  selectedBarrio: Barrio | null
  isLoading: boolean
  error: string | null
  user: { id: string; email: string; role: 'admin' | 'viewer' } | null
  session: any | null
  jornadas: JornadaRelevamiento[]
  visibleLayers: {
    barrios: boolean
    luminarias: boolean
  }
  activeBaseMap: 'osm' | 'satellite'
  officialPoints: any[]
  mapFilters: {
    barrio: string
    estadoBase: string
  }

  // Acciones
  fetchBarrios: () => Promise<void>
  setBarrios: (barrios: Barrio[]) => void
  setTareas: (tareas: TareaRelevamiento[]) => void
  setSelectedBarrio: (barrio: Barrio | null) => void
  addBarrio: (barrio: Barrio) => void
  updateBarrio: (id: string, updates: Partial<Barrio>) => Promise<void>
  addTarea: (tarea: TareaRelevamiento) => Promise<void>
  setSession: (session: any) => void
  logout: () => Promise<void>
  updateBarrioProgress: (nombre: string, progress: number) => Promise<void>
  setBarrioStatus: (nombre: string, status: EstadoBarrio) => Promise<void>
  fetchJornadas: (barrioId: string) => Promise<void>
  addJornada: (jornada: Omit<JornadaRelevamiento, 'id' | 'creadoPor'>) => Promise<void>
  toggleLayer: (layer: 'barrios' | 'luminarias') => void
  fetchOfficialPoints: () => Promise<void>
  resetOfficialPoints: (barrioId: string) => Promise<void>
  setActiveBaseMap: (baseMap: 'osm' | 'satellite') => void
  recalculateBarrioStats: (barrioIds: string[]) => Promise<void>
  setMapFilter: (filter: 'barrio' | 'estadoBase', value: string) => void

  // Selectores
  getBarrioByNombre: (nombre: string) => Barrio | undefined
  getBarrioStatus: (nombre: string) => EstadoBarrio
  getBarrioProgress: (nombre: string) => number
  getBarriosByEstado: (estado: EstadoBarrio) => Barrio[]
  getBarriosConTareas: () => Barrio[]

  // Inicialización desde GeoJSON
  initializeFromGeoJSON: (features: BarrioFeature[]) => Promise<void>
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
      user: null,
      session: null,
      jornadas: [],
      visibleLayers: {
        barrios: true,
        luminarias: true
      },
      activeBaseMap: 'osm',
      officialPoints: [],
      mapFilters: {
        barrio: '',
        estadoBase: ''
      },

      setSession: (session) => {
        const userEmail = session?.user?.email
        const isAdmin = userEmail === 'a.m.saposnik@gmail.com'
        
        set({ 
          session,
          user: session ? { 
            id: session.user.id,
            email: userEmail, 
            role: isAdmin ? 'admin' : 'viewer' 
          } : null 
        })
      },
      
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },

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
              superficie_ha: b.superficie_ha,
              luminariasEstimadas: b.luminarias_estimadas,
              luminariasRelevadas: b.luminarias_relevadas,
              fechaInicio: b.fecha_inicio ? new Date(b.fecha_inicio) : undefined,
              fechaFin: b.fecha_fin ? new Date(b.fecha_fin) : undefined,
              observaciones: b.observaciones,
            }))
            set((state) => ({ 
              barrios: barriosMapeados.map(nb => {
                const existing = state.barrios.find(eb => eb.id === nb.id)
                return { ...nb, geojson: existing?.geojson || null }
              }), 
              isLoading: false 
            }))
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
        set((state) => {
          const updatedBarrios = state.barrios.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          )
          const updatedSelected = state.selectedBarrio?.id === id 
            ? { ...state.selectedBarrio, ...updates } 
            : state.selectedBarrio

          return {
            barrios: updatedBarrios,
            selectedBarrio: updatedSelected
          }
        })

        // Sincronizar con Supabase
        const supabaseUpdates: any = {
          updated_at: new Date().toISOString()
        }
        
        if (updates.nombre !== undefined) supabaseUpdates.nombre = updates.nombre
        if (updates.estado !== undefined) supabaseUpdates.estado = updates.estado
        if (updates.progreso !== undefined) supabaseUpdates.progreso = updates.progreso
        if (updates.luminariasEstimadas !== undefined) supabaseUpdates.luminarias_estimadas = updates.luminariasEstimadas
        if (updates.luminariasRelevadas !== undefined) supabaseUpdates.luminarias_relevadas = updates.luminariasRelevadas
        if (updates.observaciones !== undefined) supabaseUpdates.observaciones = updates.observaciones
        if (updates.superficie_ha !== undefined) supabaseUpdates.superficie_ha = updates.superficie_ha

        try {
          const { error } = await supabase
            .from('barrios')
            .update(supabaseUpdates)
            .eq('id', id)

          if (error) throw error
        } catch (error: any) {
          console.error('Error updating barrio:', error)
          set({ error: error.message })
        }
      },

      addTarea: async (tarea) => {
        // Actualizar local
        set((state) => ({
          tareas: [...state.tareas, tarea],
        }))

        // Sincronizar con Supabase
        try {
          const { error } = await supabase
            .from('tareas')
            .insert({
              id: tarea.id,
              tipo: tarea.tipo,
              nombre: tarea.nombre,
              estado: tarea.estado,
              progreso: tarea.progreso,
              barrio_id: tarea.barrioId,
              creado_por: tarea.creadoPor,
              created_at: tarea.createdAt.toISOString(),
              updated_at: tarea.updatedAt.toISOString(),
            })

          if (error) throw error
        } catch (error: any) {
          console.error('Error adding tarea:', error)
          set({ error: error.message })
        }
      },

      updateBarrioProgress: async (nombre, progress) => {
        const barrio = get().barrios.find((b) => b.nombre === nombre)
        if (!barrio) return

        const newProgress = Math.min(100, Math.max(0, progress))
        const currentEstado = barrio.estado
        let estado = currentEstado

        // Solo cambiar a progreso automáticamente si estaba pendiente o fue reactivado
        if (newProgress > 0 && (currentEstado === 'pendiente' || !currentEstado)) {
          estado = 'progreso'
        }

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

      // Inicialización desde GeoJSON: Sincronización Total
      initializeFromGeoJSON: async (features) => {
        const { barrios, updateBarrio } = get()
        const geojsonNames = features.map(f => f.properties.Nombre).filter(Boolean)
        const dbNames = barrios.map(b => b.nombre)

        console.log(`Sincronizando GeoJSON: ${geojsonNames.length} barrios encontrados.`)

        // 1. Barrios para ELIMINAR (Están en DB pero NO en GeoJSON)
        const toDelete = barrios.filter(b => !geojsonNames.includes(b.nombre))
        for (const barrio of toDelete) {
          console.log(`Eliminando barrio obsoleto: ${barrio.nombre}`)
          try {
            await supabase.from('barrios').delete().eq('id', barrio.id)
          } catch (err) {
            console.error(`Error deleting ${barrio.nombre}:`, err)
          }
        }

        // 2. Barrios para AGREGAR (Están en GeoJSON pero NO en DB)
        const toAdd = features.filter(f => !dbNames.includes(f.properties.Nombre))
        for (const feature of toAdd) {
          const nombre = feature.properties.Nombre
          const areaM2 = area(feature)
          const areaHa = Math.round((areaM2 / 10000) * 100) / 100
          
          console.log(`Agregando nuevo barrio: ${nombre} (${areaHa} Ha)`)
          try {
            const { error } = await supabase.from('barrios').insert({
              nombre,
              superficie_ha: areaHa,
              estado: 'pendiente',
              progreso: 0,
              luminarias_estimadas: Math.round(areaHa * 4), // Default adaptativo (4 por manzana)
              luminarias_relevadas: 0
            })
            if (error) throw error
          } catch (err) {
            console.error(`Error adding ${nombre}:`, err)
          }
        }

        // 3. Barrios para ACTUALIZAR (Están en ambos)
        // Ya que el fetchBarrios refrescará todo, solo nos aseguramos de actualizar superficie si cambió
        for (const barrio of barrios) {
          const feature = features.find(f => f.properties.Nombre === barrio.nombre)
          if (feature) {
            const areaM2 = area(feature)
            const areaHa = Math.round((areaM2 / 10000) * 100) / 100
            
            // Actualizar si la superficie cambió O si faltan las estimaciones base
            if (areaHa !== barrio.superficie_ha || (barrio.luminariasEstimadas || 0) === 0) {
              console.log(`Actualizando datos base: ${barrio.nombre} -> ${areaHa} Ha`)
              await updateBarrio(barrio.id, { 
                superficie_ha: areaHa,
                luminariasEstimadas: barrio.luminariasEstimadas || Math.round(areaHa * 4)
              })
            }
          }
        }

        // 4. Refrescar todo el estado desde la DB final
        await get().fetchBarrios()

        // 5. Inyectar GeoJSON en el estado local para validaciones espaciales
        set((state) => ({
          barrios: state.barrios.map(b => {
            const feature = features.find(f => f.properties.Nombre === b.nombre)
            return { ...b, geojson: feature || null }
          })
        }))
      },

      fetchJornadas: async (barrioId) => {
        const { data, error } = await supabase
          .from('jornadas_relevamiento')
          .select('*')
          .eq('barrio_id', barrioId)
          .order('fecha', { ascending: false })

        if (error) {
          console.error('Error fetching jornadas:', error)
          return
        }

        const jornadasMapeadas = data.map((j: any) => ({
          id: j.id,
          barrioId: j.barrio_id,
          fecha: new Date(j.fecha),
          agentes: j.agentes,
          horas: j.horas,
          luminariasRelevadas: j.luminarias_relevadas,
          observaciones: j.observaciones,
          creadoPor: j.creado_por
        }))

        set({ jornadas: jornadasMapeadas })
      },

      addJornada: async (jornada) => {
        const { user } = get()
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('jornadas_relevamiento')
            .insert({
              barrio_id: jornada.barrioId,
              fecha: jornada.fecha.toISOString().split('T')[0],
              agentes: jornada.agentes,
              horas: jornada.horas,
              luminarias_relevadas: jornada.luminariasRelevadas,
              observaciones: jornada.observaciones,
              creado_por: user.id
            })
            .select()
            .single()

          if (error) throw error

          // Actualizar estado local de jornadas
          const nuevaJornada = {
            id: data.id,
            barrioId: data.barrio_id,
            fecha: new Date(data.fecha),
            agentes: data.agentes,
            horas: data.horas,
            luminariasRelevadas: data.luminarias_relevadas,
            observaciones: data.observaciones,
            creadoPor: data.creado_por
          }

          set((state) => ({ jornadas: [nuevaJornada, ...state.jornadas] }))

          // Recalcular progreso del barrio de forma adaptativa
          const barrio = get().barrios.find(b => b.id === jornada.barrioId)
          if (barrio) {
            const nuevasRelevadas = (barrio.luminariasRelevadas || 0) + jornada.luminariasRelevadas
            const superficieCubiertaEstimada = barrio.superficie_ha ? (barrio.superficie_ha * (barrio.progreso / 100)) : 0
            
            // Calculamos el nuevo estimado basado en la densidad actual observada
            const nuevasEstimadas = calcularEstimadoAdaptive(
              barrio.superficie_ha || 0,
              superficieCubiertaEstimada,
              (barrio.luminariasRelevadas || 0) // Usamos el valor previo para la densidad actual
            ) || barrio.luminariasEstimadas || 0
            
            const nuevoProgreso = nuevasEstimadas > 0 ? Math.min(100, Math.round((nuevasRelevadas / nuevasEstimadas) * 100)) : 0
            
            await get().updateBarrio(barrio.id, {
              luminariasRelevadas: nuevasRelevadas,
              luminariasEstimadas: nuevasEstimadas,
              progreso: nuevoProgreso,
              estado: barrio.estado === 'pendiente' ? 'progreso' : barrio.estado
            })
          }

        } catch (error: any) {
          console.error('Error adding jornada:', error)
          set({ error: error.message })
        }
      },

      toggleLayer: (layer) => {
        set((state) => ({
          visibleLayers: {
            ...state.visibleLayers,
            [layer]: !state.visibleLayers[layer]
          }
        }))
      },

      fetchOfficialPoints: async () => {
        try {
          const { data, error } = await supabase
            .from('puntos_relevamiento')
            .select('*')

          if (error) throw error
          set({ officialPoints: data || [] })
        } catch (error: any) {
          console.error('Error fetching official points:', error)
        }
      },

      resetOfficialPoints: async (barrioId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar TODOS los puntos oficiales de este barrio? Esta acción no se puede deshacer.')) return

        set({ isLoading: true })
        try {
          // Eliminar puntos de la tabla
          const { error: puntosError } = await supabase
            .from('puntos_relevamiento')
            .delete()
            .eq('barrio_id', barrioId)

          if (puntosError) throw puntosError

          // Resetear estadísticas del barrio
          await get().updateBarrio(barrioId, {
            luminariasRelevadas: 0,
            progreso: 0,
            estado: 'pendiente'
          })

          await get().fetchOfficialPoints()
          await get().fetchBarrios()
          alert('Relevamiento reiniciado. Todos los puntos han sido eliminados.')
        } catch (error: any) {
          console.error('Error resetting points:', error)
          alert('Error al reiniciar el relevamiento: ' + error.message)
        } finally {
          set({ isLoading: false })
        }
      },

      setActiveBaseMap: (baseMap) => set({ activeBaseMap: baseMap }),

      setMapFilter: (filter, value) => set((state) => ({
        mapFilters: {
          ...state.mapFilters,
          [filter]: value
        }
      })),

      recalculateBarrioStats: async (barrioIds) => {
        if (!barrioIds || barrioIds.length === 0) return
        
        set({ isLoading: true })
        try {
          // Procesar cada barrio afectado
          for (const id of barrioIds) {
            // 1. Contar puntos oficiales en Supabase para este barrio
            const { count, error: countError } = await supabase
              .from('puntos_relevamiento')
              .select('*', { count: 'exact', head: true })
              .eq('barrio_id', id)

            if (countError) throw countError

            const nuevasRelevadas = count || 0
            const barrio = get().barrios.find((b: any) => b.id === id)
            
            if (barrio) {
              const nuevasEstimadas = Math.max(barrio.luminariasEstimadas || 0, nuevasRelevadas)
              const nuevoProgreso = nuevasEstimadas > 0 ? Math.min(100, Math.round((nuevasRelevadas / nuevasEstimadas) * 100)) : 0

              // 2. Actualizar la tabla barrios en Supabase
              await get().updateBarrio(id, {
                luminariasRelevadas: nuevasRelevadas,
                luminariasEstimadas: nuevasEstimadas,
                progreso: nuevoProgreso,
                estado: barrio.estado === 'pendiente' && nuevasRelevadas > 0 ? 'progreso' : barrio.estado
              })
            }
          }

          // 3. Refrescar datos locales
          await get().fetchBarrios()
        } catch (error: any) {
          console.error('Error recalculating stats:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'barrio-store',
      partialize: (state) => ({
        barrios: state.barrios,
        tareas: state.tareas,
        activeBaseMap: state.activeBaseMap,
      }),
    }
  )
)
