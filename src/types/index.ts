// Tipos principales del sistema de control de relevamientos

export type EstadoBarrio = 'pendiente' | 'progreso' | 'completado' | 'pausado'

export interface Barrio {
  id: string
  nombre: string
  estado: EstadoBarrio
  progreso: number // 0-100
  superficie_ha?: number
  luminariasEstimadas?: number
  luminariasRelevadas?: number
  fechaInicio?: Date
  fechaFin?: Date
  observaciones?: string
  geojson?: any
  created_at?: string
  updated_at?: string
}

export type TipoTarea = 'Barrio' | 'Calle' | 'Zona'

export type EstadoTarea = 'Pendiente' | 'En Progreso' | 'Completado' | 'Pausado'

export interface TareaRelevamiento {
  id: string
  tipo: TipoTarea
  nombre: string // Ej: "Barrio Centro", "Calle Urquiza"
  estado: EstadoTarea
  progreso: number // 0-100

  // Asignación
  asignadoA: string[] // IDs de empleados

  // Métricas
  fechaInicio?: Date
  fechaFin?: Date
  fechaPausa?: Date

  // Luminarias
  luminariasEstimadas: number
  luminariasRelevadas: number

  // Referencia
  barrioId?: string
  callesIncluidas?: string[]

  // Metadata
  createdAt: Date
  updatedAt: Date
  creadoPor: string
}

export interface Empleado {
  id: string
  nombre: string
  apellido: string
  legajo?: string
  telefono?: string
  email?: string
  activo: boolean
}

export interface EquipoRelevamiento {
  id: string
  nombre: string // Ej: "Equipo A", "Equipo Norte"
  empleados: string[] // IDs
  tareasAsignadas: string[] // IDs de tareas
  activo: boolean
}

export interface JornadaRelevamiento {
  id: string
  barrioId: string
  fecha: Date
  agentes: number
  horas: number
  luminariasRelevadas: number
  observaciones?: string
  creadoPor: string
}

export interface LuminariaPropiedades {
  direccion?: string
  barrio?: string
  sin_luz?: boolean | string
  tipo?: string
  tipo_luminaria?: string
  tipologia?: string
  estado_base?: string
  cableado?: string
  alimentacion?: string
  tipo_de_cableado?: string
  [key: string]: any
}

export interface PuntoRelevamiento {
  id: string
  geom: string | { type: 'Point'; coordinates: [number, number] }
  nombre?: string
  estado_base?: string
  barrio_id?: string
  barrio_nombre?: string
  direccion?: string
  tipo_luminaria?: string
  cableado?: string
  sin_luz?: boolean | string
  medidor?: string
  propiedades?: LuminariaPropiedades
  created_at?: string
  updated_at?: string
}

export interface RegistroRelevamiento {
  id: string
  tareaId: string
  empleadoId: string
  fecha: Date
  latitud: number
  longitud: number
  tipoLuminaria: 'LED' | 'Sodio' | 'Otro'
  estado: 'Funcionando' | 'Apagada' | 'Intermitente' | 'Dañada'
  observaciones?: string
  fotos?: string[]
}

export interface FiltrosDashboard {
  estado?: EstadoBarrio[]
  barrio?: string
  fechaDesde?: Date
  fechaHasta?: Date
  empleado?: string
}

// Tipos para el GeoJSON
export interface BarrioFeature {
  type: 'Feature'
  properties: {
    fid: number
    Nombre: string
    [key: string]: string | number | undefined
  }
  geometry: {
    type: 'MultiPolygon'
    coordinates: number[][][][]
  }
}

export interface BarrioGeoJSON {
  type: 'FeatureCollection'
  name: string
  crs: {
    type: string
    properties: {
      name: string
    }
  }
  features: BarrioFeature[]
}

// ============================================
// Sistema de Capas IDE-Style
// ============================================

export type LayerType = 'point' | 'line' | 'polygon' | 'heatmap' | 'geojson'
export type LayerSource = 'supabase' | 'geojson' | 'wms' | 'wfs'

export interface LayerStyle {
  color?: string
  fillColor?: string
  fillOpacity?: number
  radius?: number
  weight?: number
  opacity?: number
}

export interface MapLayer {
  id: string
  name: string
  type: LayerType
  source: LayerSource
  visible: boolean
  style: LayerStyle
  domain: string // "luminarias" | "espacios_verdes" | "pavimento"
  sublayer?: string // "led" | "vapor" | "parques" | "plazas"
  opacity: number // 0-100
  description?: string
  dataSource?: string // tabla o endpoint
}

export interface LayerDomain {
  id: string // "luminarias" | "espacios_verdes" | "pavimento"
  name: string
  icon: string // icono lucide-react
  layers: MapLayer[]
  expanded?: boolean
}

export type BaseMapType = 'osm' | 'osm-dark' | 'satellite' | 'argenmap'
