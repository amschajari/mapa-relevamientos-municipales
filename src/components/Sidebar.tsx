import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Map,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogIn,
  LogOut,
  UploadCloud,
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useBarrioStore } from '@/stores'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NavItem {
  label: string
  icon: React.ElementType
  active?: boolean
  onClick?: () => void
}

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLoginClick: () => void
}

export const Sidebar = ({ activeTab, onTabChange, onLoginClick }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, barrios, mapFilters, setMapFilter, officialPoints } = useBarrioStore()

  // Calcular última actualización basada en los puntos
  const lastUpdate = useMemo(() => {
    if (!officialPoints || officialPoints.length === 0) return null
    const dates = officialPoints
      .map((p: any) => p.created_at || p.updated_at)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
    if (dates.length === 0) return null
    return new Date(Math.max(...dates))
  }, [officialPoints])

  // Opciones únicas de estado_base extraídas de los puntos oficiales (o hardcodeadas por ahora)
  const estadoBaseOptions = [
    { value: '', label: 'Todos' },
    { value: 'ok', label: 'En buenas condiciones' },
    { value: 'malas', label: 'Malas condiciones / Deteriorada' },
    { value: 'sin_base', label: 'Sin base' }
  ]

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Mapa', icon: Map },
    { label: 'Barrios', icon: Building2 },
    { label: 'Equipos', icon: Users },
    { label: 'Estadísticas', icon: BarChart3 },
    { label: 'Importar Datos', icon: UploadCloud },
  ]

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-20 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 mr-2 py-3">
              <h1 className="text-sm font-black text-gray-900 leading-[1.1] mb-0.5 break-words">
                Gestión de Relevamientos Municipales
              </h1>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-primary-600 truncate">
                  Alejandro Saposnik
                </p>
                {lastUpdate && (
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    Act: {format(lastUpdate, "dd/MM/yy HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <Map className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.label
            const Icon = item.icon

            return (
              <li key={item.label}>
                <button
                  onClick={() => onTabChange(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-gray-50',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary-600' : 'text-gray-500'
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {!collapsed && activeTab === 'Mapa' && (
          <div className="mt-8 px-3 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
              Filtros de Mapa
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 block">Barrio</label>
                <select
                  value={mapFilters.barrio}
                  onChange={(e) => setMapFilter('barrio', e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                >
                  <option value="">Todos los barrios</option>
                  {barrios.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 block">Estado de Base</label>
                <select
                  value={mapFilters.estadoBase}
                  onChange={(e) => setMapFilter('estadoBase', e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                >
                  {estadoBaseOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col gap-3">
          {user ? (
            <>
              {!collapsed ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">AS</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">Alejandro S.</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={logout}
                  className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto hover:bg-primary-200 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5 text-primary-700" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                "bg-gray-100 text-gray-700 hover:bg-primary-600 hover:text-white group",
                collapsed && "justify-center px-0"
              )}
              title="Entrar como Admin"
            >
              <LogIn className="w-4 h-4" />
              {!collapsed && <span>Login Admin</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
