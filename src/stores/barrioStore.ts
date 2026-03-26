import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Barrio, BarrioFeature, EstadoBarrio, TareaRelevamiento, JornadaRelevamiento } from '@/types'
import area from '@turf/area'
import { calcularEstimadoAdaptive } from '@/lib/projectionUtils'

interface AppConfig {
  agentesActuales: number
  horasPorSalida: number
  luminariasPorSalida: number
  salidasPorSemana: number
}

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
  discoveryPoints: any[]
  mapFilters: {
    barrio: string
    estadoBase: string
  }
  config: {
    agentesActuales: number
    horasPorSalida: number
    luminariasPorSalida: number  // ritmo observado (ej: 85 con 2 agentes)
    salidasPorSemana: number
  }
  // Nuevos estados para configuración desde Supabase
  appConfigLoaded: boolean
  appConfigError: string | null

  // Acciones
  fetchBarrios: () => Promise<void>
  setBarrios: (barrios: Barrio[]) => void
  setTareas: (tareas: TareaRelevamiento[]) => void
  setSelectedBarrio: (barrio: Barrio | null) => void
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
  setMapFilter: (key: 'barrio' | 'estadoBase', value: string) => void
  recalculateBarrioStats: (barrioIds: string[]) => Promise<void>
  addBarrio: (barrio: Omit<Barrio, 'id'>) => Promise<Barrio>
  setConfig: (configUpdate: Partial<BarrioState['config']>) => void
  fetchAppConfig: () => Promise<void>
  updateAppConfig: (updates: Partial<AppConfig>) => Promise<void>

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
        barrios: false,
        luminarias: true
      },
      activeBaseMap: 'osm',
      officialPoints: [],
      discoveryPoints: [],
      mapFilters: {
        barrio: '',
        estadoBase: ''
      },
      config: {
        agentesActuales: 2,
        horasPorSalida: 3,
        luminariasPorSalida: 85,  // ritmo observado: 170 luminarias / 2 salidas
        salidasPorSemana: 2
      },
      // Nuevos estados para configuración desde Supabase
      appConfigLoaded: false,
      appConfigError: null,

      setSession: (session: any) => {
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
            set((state: BarrioState) => ({ 
              barrios: barriosMapeados.map((nb: Barrio) => {
                const existing = state.barrios.find((eb: Barrio) => eb.id === nb.id)
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

      setBarrios: (barrios: Barrio[]) => set({ barrios }),
      setTareas: (tareas: TareaRelevamiento[]) => set({ tareas }),
      setSelectedBarrio: (barrio: Barrio | null) => set({ selectedBarrio: barrio }),

      addBarrio: async (barrioData: Omit<Barrio, 'id'>) => {
        try {
          const { data, error } = await supabase
            .from('barrios')
            .insert({
              nombre: barrioData.nombre,
              estado: barrioData.estado || 'pendiente',
              progreso: barrioData.progreso || 0,
              luminarias_estimadas: barrioData.luminariasEstimadas || 0,
              luminarias_relevadas: barrioData.luminariasRelevadas || 0,
              observaciones: barrioData.observaciones || ''
            })
            .select()
            .single()

          if (error) throw error

          const nuevoBarrio: Barrio = {
            id: data.id,
            nombre: data.nombre,
            estado: data.estado as EstadoBarrio,
            progreso: Number(data.progreso),
            luminariasEstimadas: data.luminarias_estimadas,
            luminariasRelevadas: data.luminarias_relevadas,
            observaciones: data.observaciones,
            superficie_ha: data.superficie_ha,
            created_at: data.created_at,
            updated_at: data.updated_at
          }

          set((state: BarrioState) => ({
            barrios: [nuevoBarrio, ...state.barrios],
            selectedBarrio: nuevoBarrio
          }))

          return nuevoBarrio
        } catch (error: any) {
          console.error('Error adding barrio:', error)
          set({ error: error.message })
          throw error
        }
      },

      updateBarrio: async (id: string, updates: Partial<Barrio>) => {
        // Actualizar local
        set((state: BarrioState) => {
          const updatedBarrios = state.barrios.map((b: Barrio) =>
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

      addTarea: async (tarea: TareaRelevamiento) => {
        // Actualizar local
        set((state: BarrioState) => ({
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

      updateBarrioProgress: async (nombre: string, progress: number) => {
        const barrio = get().barrios.find((b: Barrio) => b.nombre === nombre)
        if (!barrio) return

        const newProgress = Math.min(100, Math.max(0, progress))
        const currentEstado = barrio.estado
        let estado = currentEstado

        // Solo cambiar a progreso automáticamente si estaba pendiente o fue reactivado
        if (newProgress > 0 && (currentEstado === 'pendiente' || !currentEstado)) {
          estado = 'progreso'
        }

        // Actualizar local
        set((state: BarrioState) => ({
          barrios: state.barrios.map((b: Barrio) =>
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
          set({ error: error.message })
        }
      },

      setBarrioStatus: async (nombre: string, status: EstadoBarrio) => {
        // Actualizar local
        set((state: BarrioState) => ({
          barrios: state.barrios.map((b: Barrio) =>
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
          set({ error: error.message })
        }
      },

      // Selectores
      getBarrioByNombre: (nombre: string) => get().barrios.find((b: Barrio) => b.nombre === nombre),
      getBarrioStatus: (nombre: string) => {
        const barrio = get().barrios.find((b: Barrio) => b.nombre === nombre)
        return barrio?.estado || 'pendiente'
      },
      getBarrioProgress: (nombre: string) => {
        const barrio = get().barrios.find((b: Barrio) => b.nombre === nombre)
        return barrio?.progreso || 0
      },
      getBarriosByEstado: (estado: EstadoBarrio) =>
        get().barrios.filter((b: Barrio) => b.estado === estado),
      getBarriosConTareas: () => {
        const tareas = get().tareas
        return get().barrios.filter((b: Barrio) => 
          tareas.some((t: TareaRelevamiento) => t.barrioId === b.id)
        )
      },

      // Inicialización desde GeoJSON: Sincronización Total
      initializeFromGeoJSON: async (features: BarrioFeature[]) => {
        // En lugar de resetear todo, vamos a actualizar los datos base de los barrios existentes
        const { barrios, updateBarrio } = get()
        
        // Actualización de datos base si es necesario...

        const geojsonNames = features.map((f: BarrioFeature) => f.properties.Nombre).filter(Boolean)
        const dbNames = barrios.map((b: Barrio) => b.nombre)

        console.log(`Sincronizando GeoJSON: ${geojsonNames.length} barrios encontrados.`)

        // 1. Barrios para ELIMINAR (Están en DB pero NO en GeoJSON)
        const toDelete = barrios.filter((b: Barrio) => !geojsonNames.includes(b.nombre))
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
          const feature = features.find((f: BarrioFeature) => f.properties.Nombre === barrio.nombre)
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
        set((state: BarrioState) => ({
          barrios: state.barrios.map((b: Barrio) => {
            const feature = features.find((f: BarrioFeature) => f.properties.Nombre === b.nombre)
            return { ...b, geojson: feature || null }
          })
        }))
      },

      fetchJornadas: async (barrioId: string) => {
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

      addJornada: async (jornada: Omit<JornadaRelevamiento, 'id' | 'creadoPor'>) => {
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

          set((state: BarrioState) => ({ jornadas: [nuevaJornada, ...state.jornadas] }))

          // Recalcular progreso del barrio de forma adaptativa
          const barrio = get().barrios.find((b: Barrio) => b.id === jornada.barrioId)
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

      toggleLayer: (layer: 'barrios' | 'luminarias') => {
        set((state: BarrioState) => ({
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

      resetOfficialPoints: async (barrioId: string) => {
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

      setActiveBaseMap: (baseMap: 'osm' | 'satellite') => set({ activeBaseMap: baseMap }),

      setMapFilter: (filter: 'barrio' | 'estadoBase', value: string) => set((state: BarrioState) => ({
        mapFilters: {
          ...state.mapFilters,
          [filter]: value
        }
      })),

      recalculateBarrioStats: async (barrioIds: string[]) => {
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

      setConfig: (configUpdate: Partial<BarrioState['config']>) => {
        set((state: BarrioState) => ({
          config: { ...state.config, ...configUpdate }
        }))
        
        // Also update in Supabase (fire and forget)
        get().updateAppConfig(configUpdate).catch((err: any) => {
          console.warn('Failed to persist config update to Supabase:', err)
        })
      },

      // Nueva acción: obtener configuración desde Supabase
      fetchAppConfig: async () => {
        set({ appConfigLoaded: false, appConfigError: null })
        try {
          const { data, error } = await supabase
            .from('app_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
          
          if (error) throw error
          
          if (data && data.length > 0) {
            const configData = data[0];
            set({
              appConfigLoaded: true,
              appConfigError: null,
              config: {
                agentesActuales: configData.agentes_actuales,
                horasPorSalida: configData.horas_por_salida,
                luminariasPorSalida: configData.luminarias_por_salida,
                salidasPorSemana: configData.salidas_por_semana
              }
            })
          } else {
            // Si no hay configuración, usar valores por defecto
            set({
              appConfigLoaded: true,
              appConfigError: null,
              config: {
                agentesActuales: 2,
                horasPorSalida: 3,
                luminariasPorSalida: 85,
                salidasPorSemana: 2
              }
            })
          }
        } catch (error: any) {
          console.error('Error fetching app config:', error)
          set({
            appConfigLoaded: true,
            appConfigError: error.message,
            config: {
              agentesActuales: 2,
              horasPorSalida: 3,
              luminariasPorSalida: 85,
              salidasPorSemana: 2
            }
          })
        }
      },

       // Nueva acción: actualizar configuración en Supabase
       updateAppConfig: async (updates: Partial<AppConfig>) => {
         try {
           // Mapear camelCase → snake_case para Supabase
           const dbUpdates: Record<string, any> = {
             updated_at: new Date().toISOString()
           }
           if ('agentesActuales' in updates) dbUpdates.agentes_actuales = updates.agentesActuales
           if ('horasPorSalida' in updates) dbUpdates.horas_por_salida = updates.horasPorSalida
           if ('luminariasPorSalida' in updates) dbUpdates.luminarias_por_salida = updates.luminariasPorSalida
           if ('salidasPorSemana' in updates) dbUpdates.salidas_por_semana = updates.salidasPorSemana

           // Obtener el registro más reciente (si existe)
           const { data: records, error: listError } = await supabase
             .from('app_config')
             .select('id')
             .order('updated_at', { ascending: false })
             .limit(1)

           if (listError) throw listError

           let query
           if (records && records.length > 0) {
             // Actualizar el registro existente más reciente
             query = supabase
               .from('app_config')
               .update(dbUpdates)
               .eq('id', records[0].id)
           } else {
             // Insertar nuevo registro (cuando no hay ninguno)
             query = supabase
               .from('app_config')
               .insert(dbUpdates)
           }

           const { error } = await query
           if (error) throw error

           // Actualizar estado local optimistamente
           set((state: BarrioState) => ({
             config: {
               ...state.config,
               ...updates
             }
           }))
         } catch (error: any) {
           console.error('Error updating app config:', error)
           throw error
         }
       }
    }),
    {
      name: 'barrio-store',
      partialize: (state: any) => ({
        // Excluimos config del persistence porque viene de Supabase
        // Pero mantenemos el resto del estado en localStorage
        barrios: state.barrios,
        tareas: state.tareas,
        user: state.user,
        session: state.session,
        jornadas: state.jornadas,
        visibleLayers: state.visibleLayers,
        activeBaseMap: state.activeBaseMap,
        officialPoints: state.officialPoints,
        discoveryPoints: state.discoveryPoints,
        mapFilters: state.mapFilters,
        // config: state.config,  // NO persistir esto
        appConfigLoaded: state.appConfigLoaded,
        appConfigError: state.appConfigError
      })
    }
  )
)

// Inicialización automática de la configuración desde Supabase
if (typeof window !== 'undefined') {
  // Esperamos un poco para que el store esté completamente inicializado
  setTimeout(() => {
    useBarrioStore.getState().fetchAppConfig()
  }, 0)
}