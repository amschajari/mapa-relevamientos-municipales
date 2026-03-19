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
