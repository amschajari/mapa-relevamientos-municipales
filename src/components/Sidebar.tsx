import {
  LayoutDashboard,
  Map,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogIn,
  LogOut,
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useState } from 'react'
import { useBarrioStore } from '@/stores'

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
  const { user, logout } = useBarrioStore()

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Mapa', icon: Map },
    { label: 'Barrios', icon: Building2 },
    { label: 'Equipos', icon: Users },
    { label: 'Estadísticas', icon: BarChart3 },
    { label: 'Configuración', icon: Settings },
  ]

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-sm">Control Relevam.</span>
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
      <nav className="flex-1 py-4 px-2">
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
