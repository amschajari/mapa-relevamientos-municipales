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
import { useBarrioStore } from '@/stores'
import { calcularDiasRestantes } from '@/lib/projectionUtils'

interface DashboardViewProps {
  barrios: Barrio[]
}

export const DashboardView = ({ barrios }: DashboardViewProps) => {
  const { officialPoints } = useBarrioStore()
  
  const stats = useMemo(() => {
    const total = barrios.length
    const completados = barrios.filter((b) => b.estado === 'completado').length
    const enProgreso = barrios.filter((b) => b.estado === 'progreso').length
    const pendientes = barrios.filter((b) => b.estado === 'pendiente').length
    const pausados = barrios.filter((b) => b.estado === 'pausado').length

    const superficieTotal = barrios.reduce((acc, b) => acc + (b.superficie_ha || 0), 0)
    const superficieRelevada = barrios.reduce((acc, b) => {
      if (b.estado === 'completado') return acc + (b.superficie_ha || 0)
      if (b.estado === 'progreso') return acc + ((b.superficie_ha || 0) * (b.progreso / 100))
      return acc
    }, 0)

    const progresoSuperficie = superficieTotal > 0 ? Math.round((superficieRelevada / superficieTotal) * 100) : 0

    return {
      total,
      completados,
      enProgreso,
      pendientes,
      pausados,
      superficieTotal,
      superficieRelevada,
      progresoSuperficie,
      puntosTotales: officialPoints?.length || 0,
      diasRestantes: calcularDiasRestantes(superficieTotal - superficieRelevada, {
        agentes: 2,
        horasPorDia: 3,
        velocidadEstimadaHaHora: 0.5
      })
    }
  }, [barrios, officialPoints])

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
            icon={TrendingUp}
            label="Superficie Total"
            value={`${stats.superficieTotal.toFixed(1)} Ha`}
            subValue={`${stats.superficieRelevada.toFixed(1)} Ha cubiertas`}
            color="bg-indigo-500"
          />
          <StatCard
            icon={MapPin}
            label="Luminarias Cargadas (Puntos)"
            value={stats.puntosTotales}
            subValue="Cargados vía CSV / GeoJSON"
            color="bg-purple-500"
            trend={stats.puntosTotales > 0 ? "¡Nuevos datos!" : undefined}
          />
          <StatCard
            icon={Clock}
            label="Proyección Final"
            value={`~${stats.diasRestantes} días`}
            subValue="2 personas, 3hs/día"
            color="bg-amber-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Avance Barrios"
            value={`${stats.completados}/${stats.total}`}
            subValue={`${stats.progresoSuperficie}% de la superficie`}
            color="bg-green-500"
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
                <h3 className="font-semibold text-gray-800">Cobertura de Superficie</h3>
                <p className="text-sm text-gray-500">
                  {stats.superficieRelevada.toFixed(1)} de {stats.superficieTotal.toFixed(1)} Hectáreas cubiertas
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-600">{stats.progresoSuperficie}%</p>
              <p className="text-xs text-gray-500">avance por área</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${stats.progresoSuperficie}%` }}
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
