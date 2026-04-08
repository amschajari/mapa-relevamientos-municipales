import { useMemo } from 'react'
import {
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  Zap,
} from 'lucide-react'
import type { Barrio } from '@/types'
import { format } from 'date-fns'
import { useBarrioStore } from '@/stores'


const SimuladorCampana = ({ luminariasRestantes }: { luminariasRestantes: number }) => {

  // Valores de referencia (se configuran en la pestaña Equipos por el administrador)
  const agentes = 3
  const horas = 3
  const rendimiento = 80
  const diasLaborables = 5

  const manHoursBase = 3 * 3; 
  const luminariasPorHoraHombre = rendimiento / manHoursBase;

  const manHoursSimulado = agentes * horas;
  const luminariasAlDia = manHoursSimulado * luminariasPorHoraHombre;

  const diasRestantes = luminariasRestantes > 0 && luminariasAlDia > 0 ? Math.ceil(luminariasRestantes / luminariasAlDia) : 0
  const semanasRestantes = diasLaborables > 0 ? Math.ceil(diasRestantes / diasLaborables) : 0

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm w-full">
      {/* Tiempos Estimativos */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500 rounded-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Tiempos Estimativos</h3>
          <p className="text-sm text-gray-500">Variables operativas actuales del equipo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
          <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Agentes</p>
          <p className="text-3xl font-black text-gray-800">{agentes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
          <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Horas/Día</p>
          <p className="text-3xl font-black text-gray-800">{horas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
          <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Luces/Jornada</p>
          <p className="text-3xl font-black text-gray-800">{rendimiento}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
          <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Días/Sem.</p>
          <p className="text-3xl font-black text-gray-800">{diasLaborables}</p>
        </div>
      </div>

      {/* Demoras Iterables */}
      <div className="border-t border-amber-200 pt-4">
        <p className="text-[10px] uppercase font-black tracking-wider text-amber-600 mb-3">Demoras Iterables</p>
        <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <div className="p-4 bg-green-100 rounded-full">
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Tiempo estimado al cierre</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900">{semanasRestantes}</span>
              <span className="font-bold text-gray-600 tracking-wide">semanas operativas</span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">{diasRestantes} salidas · {luminariasRestantes} luminarias restantes para la meta ciudad.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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

    const META_CIUDAD = 8000
    const puntosTotales = officialPoints?.length || 0
    const progresoGlobalLuminarias = Math.round((puntosTotales / META_CIUDAD) * 100)

    return {
      total,
      completados,
      enProgreso,
      pendientes,
      pausados,
      puntosTotales,
      progresoGlobalLuminarias,
      metaCiudad: META_CIUDAD,
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
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-black text-gray-800">{value}</p>
          {subValue && <p className="text-xs font-medium text-gray-400 mt-1">{subValue}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-bold">{trend}</span>
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-gray-600">
              <Calendar className="w-4 h-4 inline mr-2 text-gray-400" />
              {format(new Date(), 'dd/MM/yyyy')}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatCard
             icon={MapPin}
             label="Avance Ciudad"
             value={`${stats.progresoGlobalLuminarias}%`}
             subValue={`${stats.puntosTotales} encontradas de ${stats.metaCiudad}`}
             color="bg-primary-600"
             trend={stats.puntosTotales > 0 ? "Relevamiento Activo" : undefined}
           />
           <StatCard
             icon={CheckCircle2}
             label="Gestión de Polígonos"
             value={`${stats.completados}/${stats.total}`}
             subValue={`Barrios relevados al 100%`}
             color="bg-emerald-500"
           />
           <StatCard
             icon={Users}
             label="Equipos (Salidas)"
             value={stats.enProgreso}
             subValue={`Barrios actualmente operando`}
             color="bg-sky-500"
           />
        </div>

        {/* Simulador Central */}
        <div className="w-full">
          <SimuladorCampana 
            luminariasRestantes={stats.metaCiudad - stats.puntosTotales} 
          />
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
              <div className="space-y-2">
                {barriosRecientes.map((barrio) => (
                  <div
                    key={barrio.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          barrio.estado === 'completado' ? 'bg-green-500' :
                          barrio.estado === 'progreso' ? 'bg-amber-500' : 'bg-gray-400'
                        }`}
                      />
                      <p className="font-medium text-gray-800 text-sm">{barrio.nombre}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      barrio.estado === 'completado' ? 'bg-green-100 text-green-700' :
                      barrio.estado === 'progreso' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {barrio.estado === 'completado' ? 'Completado' :
                       barrio.estado === 'progreso' ? 'En curso' : 'Pausado'}
                    </span>
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
