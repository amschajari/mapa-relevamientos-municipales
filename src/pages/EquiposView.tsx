import { useState } from 'react'
import { Users, Settings, Save, Info, CheckCircle } from 'lucide-react'
import { useBarrioStore } from '@/stores'

export const EquiposView = () => {
  const { config, setConfig, user } = useBarrioStore()
  const [localConfig, setLocalConfig] = useState(config)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await setConfig(localConfig)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setLocalConfig({
      agentesActuales: 2,
      horasPorSalida: 3,
      luminariasPorSalida: 85,
      salidasPorSemana: 2
    })
  }

  // Calcular métricas derivadas
  const luminariasPorAgente = localConfig.luminariasPorSalida / localConfig.agentesActuales
  const metaTotal = 8000

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Equipos de Relevamiento</h1>
            <p className="text-sm text-gray-500">
              Configuración de equipos y ritmo de trabajo
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar configuración
            </button>
          )}
        </div>

        {/* Toast de guardado */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">Configuración guardada</p>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">Configuración actual</p>
            <p className="text-sm text-blue-700">
              Estos valores se usan para calcular la proyección de avance en el Dashboard.
              El ritmo base (85 luminarias/salida) se obtuvo del piloto: 170 luminarias en 2 salidas de 3hs con 2 agentes.
            </p>
          </div>
        </div>

        {/* Configuración principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel de configuración */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Settings className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Parámetros del equipo</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agentes actuales
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localConfig.agentesActuales}
                  onChange={(e) => setLocalConfig({ ...localConfig, agentesActuales: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={user?.role !== 'admin'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad de operarios trabajando en campo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas por salida
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  step="0.5"
                  value={localConfig.horasPorSalida}
                  onChange={(e) => setLocalConfig({ ...localConfig, horasPorSalida: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={user?.role !== 'admin'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Duración estimada de cada salida de campo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Luminarias por salida
                </label>
                <input
                  type="number"
                  min="1"
                  value={localConfig.luminariasPorSalida}
                  onChange={(e) => setLocalConfig({ ...localConfig, luminariasPorSalida: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={user?.role !== 'admin'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ritmo observado: luminarias relevadas por salida (todos los agentes)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salidas por semana
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={localConfig.salidasPorSemana}
                  onChange={(e) => setLocalConfig({ ...localConfig, salidasPorSemana: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={user?.role !== 'admin'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Frecuencia esperada de salidas (varía por clima, feriados, etc.)
                </p>
              </div>
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={handleReset}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Restaurar valores por defecto
              </button>
            )}
          </div>

          {/* Panel de métricas derivadas */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Métricas calculadas</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Ritmo por agente</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ~{luminariasPorAgente.toFixed(1)} <span className="text-sm font-normal text-gray-500">luminarias/hora/agente</span>
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Capacidad diaria del equipo</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ~{localConfig.luminariasPorSalida} <span className="text-sm font-normal text-gray-500">luminarias/salida</span>
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 mb-1">Meta ciudad (Alumbrado Municipal)</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {metaTotal} <span className="text-sm font-normal text-purple-600">luminarias totales</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-900 mb-2">Nota sobre proyección</p>
              <p className="text-sm text-amber-700">
                Las salidas por semana son <strong>estimadas</strong>. El sistema no considera automáticamente
                feriados, lluvia o ausencias. El coordinador debe ajustar este valor según las condiciones reales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
