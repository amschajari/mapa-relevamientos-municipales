import { useMemo } from 'react'
import {
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react'
import type { Barrio } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardViewProps {
  barrios: Barrio[]
}

export const DashboardView = ({ barrios }: DashboardViewProps) => {
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
      porcentajeRelevamiento:
        totalLuminarias > 0 ? Math.round((relevadas / totalLuminarias) * 100) : 0,
    }
  }, [barrios])

  const barriosRecientes = useMemo(() => {
    return [...barrios]
      .filter((b) => b.estado !== 'pendiente')
      .sort((a, b) => (b.progreso || 0) - (a.progreso || 0))
      .slice(0, 5)
  }, [barrios])

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
    trend,
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    subValue?: string
    color: string
    trend?: string
  }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Control de relevamiento municipal •{' '}
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
              <Calendar className="w-4 h-4 inline mr-2" />
              {format(new Date(), 'dd/MM/yyyy')}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={MapPin}
            label="Total Barrios"
            value={stats.total}
            subValue={`${stats.completados} completados`}
            color="bg-blue-500"
            trend="+2 esta semana"
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
            icon={AlertCircle}
            label="Pausados"
            value={stats.pausados}
            subValue="Requieren atención"
            color="bg-red-500"
          />
        </div>

        {/* Progreso General */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Progreso General</h3>
                <p className="text-sm text-gray-500">
                  {stats.relevadas.toLocaleString()} de {stats.totalLuminarias.toLocaleString()} luminarias relevadas
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-600">{stats.progresoGeneral}%</p>
              <p className="text-xs text-gray-500">de barrios completados</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${stats.progresoGeneral}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Pendientes: {stats.pendientes}</span>
            <span>En progreso: {stats.enProgreso}</span>
            <span>Completados: {stats.completados}</span>
          </div>
        </div>

        {/* Barrios Recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Barrios Activos</h3>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todos
              </button>
            </div>

            {barriosRecientes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay barrios activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {barriosRecientes.map((barrio) => (
                  <div
                    key={barrio.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          barrio.estado === 'completado'
                            ? 'bg-green-500'
                            : barrio.estado === 'progreso'
                            ? 'bg-amber-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-800">{barrio.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {barrio.luminariasRelevadas || 0} de {barrio.luminariasEstimadas || 0} luminarias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800">
                        {barrio.progreso}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Resumen Rápido</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Barrios completados</span>
                </div>
                <span className="font-bold text-green-600">{stats.completados}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-700">En progreso</span>
                </div>
                <span className="font-bold text-amber-600">{stats.enProgreso}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Pendientes</span>
                </div>
                <span className="font-bold text-gray-600">{stats.pendientes}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-gray-700">Pausados</span>
                </div>
                <span className="font-bold text-red-600">{stats.pausados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
