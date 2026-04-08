import { useState } from 'react'
import {
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Barrio } from '@/types'
import { BarrioDetailModal } from '@/components/BarrioDetailModal'
import { useBarrioStore } from '@/stores'
import { cn } from '@/lib/constants'

interface BarriosViewProps {
  barrios: Barrio[]
  onViewOnMap?: (barrio: Barrio) => void
}

type SortField = 'nombre' | 'estado' | 'progreso' | 'luminarias'
type SortDirection = 'asc' | 'desc'

export const BarriosView = ({ barrios, onViewOnMap }: BarriosViewProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [sortField, setSortField] = useState<SortField>('progreso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  const { selectedBarrio, setSelectedBarrio } = useBarrioStore()

  const filteredBarrios = barrios
    .filter((b) => {
      const matchesSearch = b.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesEstado = filterEstado === 'todos' || b.estado === filterEstado
      return matchesSearch && matchesEstado
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre)
          break
        case 'estado':
          comparison = a.estado.localeCompare(b.estado)
          break
        case 'progreso':
          comparison = a.progreso - b.progreso
          break
        case 'luminarias':
          comparison = (a.luminariasRelevadas || 0) - (b.luminariasRelevadas || 0)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'progreso':
        return <Clock className="w-5 h-5 text-amber-500" />
      case 'pausado':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <MapPin className="w-5 h-5 text-gray-400" />
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'Completado'
      case 'progreso':
        return 'En Progreso'
      case 'pausado':
        return 'Pausado'
      default:
        return 'Pendiente'
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-700'
      case 'progreso':
        return 'bg-amber-100 text-amber-700'
      case 'pausado':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors",
        field === 'progreso' && "hidden sm:table-cell",
        field === 'luminarias' && "hidden md:table-cell"
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Barrios</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredBarrios.length} de {barrios.length} barrios •{' '}
              {barrios.filter(b => b.estado === 'completado').length} completados
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar barrio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="progreso">En Progreso</option>
              <option value="completado">Completados</option>
              <option value="pausado">Pausados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <SortHeader field="nombre">Nombre</SortHeader>
              <SortHeader field="estado">Estado</SortHeader>
              <SortHeader field="progreso">Progreso</SortHeader>
              <SortHeader field="luminarias">Encontradas</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBarrios.map((barrio) => (
              <tr
                key={barrio.id}
                className="hover:bg-primary-50 transition-colors cursor-pointer group"
                onClick={() => setSelectedBarrio(barrio)}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{getEstadoIcon(barrio.estado)}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">{barrio.nombre}</p>
                      <p className="hidden sm:block text-[10px] text-gray-400 font-mono">ID: {barrio.id.substring(0, 8)}...</p>
                      
                      {/* Barra de progreso móvil */}
                      <div className="sm:hidden mt-1 flex items-center gap-1.5">
                         <div className="w-12 bg-gray-100 rounded-full h-1">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                barrio.estado === 'completado' ? 'bg-green-500' : 
                                barrio.estado === 'progreso' ? 'bg-amber-500' : 'bg-gray-300'
                              )}
                              style={{ width: `${barrio.progreso}%` }}
                            />
                         </div>
                         <span className="text-[10px] font-black text-gray-400">{barrio.progreso}%</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold sm:font-medium",
                      getEstadoBadgeColor(barrio.estado)
                    )}
                  >
                    {getEstadoLabel(barrio.estado)}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-20 lg:w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          barrio.estado === 'completado'
                            ? 'bg-green-500'
                            : barrio.estado === 'progreso'
                            ? 'bg-amber-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${barrio.progreso}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {barrio.progreso}%
                    </span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-800">{barrio.luminariasRelevadas || 0}</span>
                  <span className="text-xs text-gray-400 ml-1">relevadas</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBarrios.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron barrios</p>
            <p className="text-sm text-gray-400">Intenta con otra búsqueda</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBarrio && (
        <BarrioDetailModal
          barrio={selectedBarrio}
          onClose={() => setSelectedBarrio(null)}
          onViewOnMap={(b) => {
            setSelectedBarrio(null)
            onViewOnMap?.(b)
          }}
        />
      )}
    </div>
  )
}
