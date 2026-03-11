import { useMemo } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  AlertCircle,
} from 'lucide-react'
import { Barrio, TareaRelevamiento } from '@/types'

interface EstadisticasPanelProps {
  barrios: Barrio[]
  tareas: TareaRelevamiento[]
}

export const EstadisticasPanel = ({ barrios, tareas }: EstadisticasPanelProps) => {
  const stats = useMemo(() => {
    const total = barrios.length
    const completados = barrios.filter((b) => b.estado === 'completado').length
    const enProgreso = barrios.filter((b) => b.estado === 'progreso').length
    const pendientes = barrios.filter((b) => b.estado === 'pendiente').length
    const pausados = barrios.filter((b) => b.estado === 'pausado').length

    const progresoGeneral = total > 0 ? Math.round((completados / total) * 100) : 0

    const totalLuminarias = barrios.reduce(
      (acc, b) => acc + (b.luminariasEstimadas || 0),
      0
    )
    const relevadas = barrios.reduce(
      (acc, b) => acc + (b.luminariasRelevadas || 0),
      0
    )

    return {
      total,
      completados,
      enProgreso,
      pendientes,
      pausados,
      progresoGeneral,
      totalLuminarias,
      relevadas,
      porcentajeRelevamiento: totalLuminarias > 0
        ? Math.round((relevadas / totalLuminarias) * 100)
        : 0,
    }
  }, [barrios])

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    subValue?: string
    color: string
  }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Estadísticas Generales</h2>
        <p className="text-sm text-gray-500">Resumen del estado del relevamiento</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MapPin}
          label="Total Barrios"
          value={stats.total}
          subValue={`${stats.completados} completados`}
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completados"
          value={stats.completados}
          subValue={`${Math.round((stats.completados / stats.total) * 100) || 0}% del total`}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="En Progreso"
          value={stats.enProgreso}
          subValue={`${stats.pendientes} pendientes`}
          color="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Progreso General"
          value={`${stats.progresoGeneral}%`}
          subValue="Meta: 100%"
          color="bg-purple-500"
        />
      </div>

      {/* Progreso de relevamiento de luminarias */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Relevamiento de Luminarias</h3>
              <p className="text-sm text-gray-500">Progreso de registro en campo</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">
              {stats.relevadas.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">de {stats.totalLuminarias.toLocaleString()}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-gray-800">{stats.porcentajeRelevamiento}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${stats.porcentajeRelevamiento}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completados}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.enProgreso}</p>
            <p className="text-xs text-gray-500">En Progreso</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.pendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.pausados}</p>
            <p className="text-xs text-gray-500">Pausados</p>
          </div>
        </div>
      </div>

      {/* Tareas activas */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Tareas Activas</h3>
            <p className="text-sm text-gray-500">Equipos trabajando en campo</p>
          </div>
        </div>

        {tareas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay tareas activas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tareas.slice(0, 5).map((tarea) => (
              <div
                key={tarea.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{tarea.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {tarea.tipo} • {tarea.asignadoA?.length || 0} asignados
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-800">
                    {tarea.progreso}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
