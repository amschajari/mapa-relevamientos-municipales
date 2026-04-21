import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { MapLayer, LayerDomain, BaseMapType } from '@/types'

interface EspacioVerde {
  id: string
  fid: number
  nombre: string | null
  geom: any
}

interface MapState {
  // Capas
  layers: MapLayer[]
  domains: LayerDomain[]
  activeBaseMap: BaseMapType
  
  // Datos
  espaciosVerdes: EspacioVerde[]
  
  // UI
  sidebarOpen: boolean
  layersPanelOpen: boolean
  
  // Acciones
  toggleLayer: (layerId: string) => void
  setLayerVisibility: (layerId: string, visible: boolean) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
  setLayerStyle: (layerId: string, style: Partial<MapLayer['style']>) => void
  toggleDomain: (domainId: string) => void
  setActiveBaseMap: (baseMap: BaseMapType) => void
  toggleSidebar: () => void
  toggleLayersPanel: () => void
  fetchEspaciosVerdes: () => Promise<void>
  
  // Utilidades
  getVisibleLayers: () => MapLayer[]
  getLayersByDomain: (domainId: string) => MapLayer[]
}

const DEFAULT_DOMAINS: LayerDomain[] = [
  {
    id: 'luminarias',
    name: 'Luminarias',
    icon: 'Lightbulb',
    expanded: true,
    layers: [
      {
        id: 'luminarias-todas',
        name: 'Todas las Luminarias',
        type: 'point',
        source: 'supabase',
        visible: true,
        domain: 'luminarias',
        sublayer: 'todas',
        opacity: 100,
        style: { color: '#fbbf24', radius: 5 },
        description: 'Todas las luminarias relevadas',
        dataSource: 'puntos_relevamiento'
      },
      {
        id: 'luminarias-calor',
        name: 'Mapa de Calor',
        type: 'heatmap',
        source: 'supabase',
        visible: false,
        domain: 'luminarias',
        sublayer: 'heatmap',
        opacity: 100,
        style: { color: '#ef4444', radius: 20 },
        description: 'Densidad de luminarias',
        dataSource: 'puntos_relevamiento'
      }
    ]
  },
  {
    id: 'espacios_verdes',
    name: 'Espacios Verdes',
    icon: 'Trees',
    expanded: true,
    layers: [
      {
        id: 'espacios-verdes-todos',
        name: 'Parques y Plazas',
        type: 'polygon',
        source: 'supabase',
        visible: true,
        domain: 'espacios_verdes',
        sublayer: 'todos',
        opacity: 100,
        style: { fillColor: '#22c55e', fillOpacity: 0.4, color: '#16a34a', weight: 2 },
        description: 'Parques, plazas y plazoletas de Chajarí',
        dataSource: 'espacios_verdes'
      }
    ]
  },
  {
    id: 'pavimento',
    name: 'Calles Pavimentadas',
    icon: 'Route',
    expanded: false,
    layers: [
      {
        id: 'pavimento-calles',
        name: 'Calles',
        type: 'line',
        source: 'geojson',
        visible: false,
        domain: 'pavimento',
        sublayer: 'calles',
        opacity: 100,
        style: { color: '#6b7280', weight: 3 },
        description: 'Calles pavimentadas',
        dataSource: 'calles_pavimentadas'
      },
      {
        id: 'pavimento-avenidas',
        name: 'Avenidas',
        type: 'line',
        source: 'geojson',
        visible: false,
        domain: 'pavimento',
        sublayer: 'avenidas',
        opacity: 100,
        style: { color: '#374151', weight: 4 },
        description: 'Avenidas principales',
        dataSource: 'calles_pavimentadas'
      }
    ]
  },
  {
    id: 'barrios',
    name: 'Barrios',
    icon: 'MapPin',
    expanded: true,
    layers: [
      {
        id: 'barrios-poligonos',
        name: 'Polígonos de Barrios',
        type: 'polygon',
        source: 'supabase',
        visible: false,
        domain: 'barrios',
        sublayer: 'poligonos',
        opacity: 100,
        style: { fillColor: '#3b82f6', fillOpacity: 0.1, color: '#2563eb', weight: 2 },
        description: 'Límites de barrios',
        dataSource: 'barrios'
      }
    ]
  }
]

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      layers: DEFAULT_DOMAINS.flatMap(d => d.layers),
      domains: DEFAULT_DOMAINS,
      activeBaseMap: 'osm',
      espaciosVerdes: [],
      sidebarOpen: true,
      layersPanelOpen: false,

      fetchEspaciosVerdes: async () => {
        try {
          console.log('[mapStore] Fetching espacios_verdes from Supabase...')
          const { data, error } = await supabase
            .from('espacios_verdes')
            .select('id, fid, nombre, geom')
          
          if (error) {
            console.error('[mapStore] Error fetching:', error)
            throw error
          }
          console.log('[mapStore] Loaded espacios_verdes:', data?.length, 'records')
          set({ espaciosVerdes: data || [] })
        } catch (error: any) {
          console.error('[mapStore] Error fetching espacios_verdes:', error)
        }
      },

      toggleLayer: (layerId: string) => {
        set((state) => {
          // Actualizar tanto layers como domains para mantener sincronización
          const updatedLayers = state.layers.map(l =>
            l.id === layerId ? { ...l, visible: !l.visible } : l
          )
          const updatedDomains = state.domains.map(d => ({
            ...d,
            layers: d.layers.map(l => 
              l.id === layerId ? { ...l, visible: !l.visible } : l
            )
          }))
          return {
            layers: updatedLayers,
            domains: updatedDomains
          }
        })
      },

      setLayerVisibility: (layerId: string, visible: boolean) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === layerId ? { ...l, visible } : l
          )
        }))
      },

      setLayerOpacity: (layerId: string, opacity: number) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === layerId ? { ...l, opacity } : l
          )
        }))
      },

      setLayerStyle: (layerId: string, style: Partial<MapLayer['style']>) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === layerId ? { ...l, style: { ...l.style, ...style } } : l
          )
        }))
      },

      toggleDomain: (domainId: string) => {
        set((state) => ({
          domains: state.domains.map(d =>
            d.id === domainId ? { ...d, expanded: !d.expanded } : d
          )
        }))
      },

      setActiveBaseMap: (baseMap: BaseMapType) => {
        set({ activeBaseMap: baseMap })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      toggleLayersPanel: () => {
        set((state) => ({ layersPanelOpen: !state.layersPanelOpen }))
      },

      getVisibleLayers: () => {
        return get().layers.filter(l => l.visible)
      },

      getLayersByDomain: (domainId: string) => {
        return get().layers.filter(l => l.domain === domainId)
      }
    }),
    {
      name: 'map-store',
      partialize: (state) => ({
        activeBaseMap: state.activeBaseMap,
        sidebarOpen: state.sidebarOpen,
        layersPanelOpen: state.layersPanelOpen,
        layers: state.layers.map(l => ({ ...l, visible: l.visible, opacity: l.opacity }))
      })
    }
  )
)

// Inicialización automática de espacios_verdes
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useMapStore.getState().fetchEspaciosVerdes()
  }, 500)
}
