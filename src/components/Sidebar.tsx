import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Map,
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogIn,
  LogOut,
  UploadCloud,
  Layers,
} from 'lucide-react'
import { useBarrioStore } from '@/stores'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/constants'
import { LayersPanel } from './LayersPanel'
import { LayerSettingsPanel } from './LayerSettingsPanel'

interface NavItem {
  label: string
  icon: React.ElementType
  active?: boolean
  onClick?: () => void
}

interface SidebarProps {
  onLoginClick: () => void
}

export const Sidebar = ({ onLoginClick }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<'nav' | 'layers'>('nav')
  
  const { user, logout, officialPoints, activeTab, setActiveTab } = useBarrioStore()

  // Calcular última actualización
  const lastUpdate = useMemo(() => {
    if (!officialPoints || officialPoints.length === 0) return null
    const sorted = [...officialPoints].sort((a, b) => 
      new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    )
    return new Date(sorted[0]?.updated_at || 0)
  }, [officialPoints])

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Mapa', icon: Map },
    { label: 'Barrios', icon: Building2 },
    ...(user?.role === 'admin' ? [{ label: 'Equipos', icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ label: 'Importar Datos', icon: UploadCloud }] : []),
  ]

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 relative',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="h-20 border-b border-gray-200 flex items-center justify-between px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 mr-2">
              <h1 className="text-[13px] font-black text-gray-900 leading-tight uppercase tracking-tight">
                Gestión Municipal | IDE
              </h1>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-primary-600">Chajarí, ER</span>
                  <span className="text-[9px] text-gray-300">|</span>
                  <span className="text-[10px] font-medium text-gray-500">Alejandro Saposnik</span>
                </div>
                {lastUpdate && lastUpdate.getTime() > 0 && (
                  <p className="text-[9px] text-gray-400">
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
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Tabs: Nav / Capas */}
      {!collapsed && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveSection('nav')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
              activeSection === 'nav'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Map className="w-4 h-4" />
            NAV
          </button>
          <button
            onClick={() => setActiveSection('layers')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
              activeSection === 'layers'
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Layers className="w-4 h-4" />
            CAPAS
          </button>
        </div>
      )}

      {/* Content: Nav o Capas */}
      {!collapsed ? (
        activeSection === 'nav' ? (
          <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.label
                const Icon = item.icon

                return (
                  <li key={item.label}>
                    <button
                      onClick={() => setActiveTab(item.label)}
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
                      <span className="text-sm">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : (
          <div className="flex-1 overflow-hidden">
            <LayersPanel className="h-full" />
          </div>
        )
      ) : (
        // Collapsed: solo icono de capas
        collapsed && (
          <button
            onClick={() => setActiveSection('layers')}
            className={cn(
              "flex flex-col items-center gap-1 py-3 text-xs",
              activeSection === 'layers' 
                ? "text-primary-600" 
                : "text-gray-400"
            )}
          >
            <Layers className="w-5 h-5" />
            <span>Capas</span>
          </button>
        )
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex flex-col gap-2">
          {user ? (
            <>
              {!collapsed ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate capitalize">
                      {user.role}
                    </p>
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

      {/* Panel de Ajustes Contextual (IDE Style) */}
      {activeSection === 'layers' && <LayerSettingsPanel />}
    </aside>
  )
}