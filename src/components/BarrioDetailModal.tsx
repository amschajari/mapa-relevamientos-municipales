import { useState, useEffect } from 'react'
import { 
  X, 
  MapPin, 
  Save, 
  Edit2, 
  AlertCircle, 
  Map as MapIcon, 
  ClipboardList,
  Users,
  Clock,
  Calendar,
  History,
  CheckCircle,
  PlusCircle
} from 'lucide-react'
import type { Barrio, EstadoBarrio } from '@/types'
import { useBarrioStore } from '@/stores'
import { TaskAssignmentModal } from './TaskAssignmentModal'
import { calcularDiasRestantes } from '@/lib/projectionUtils'

interface BarrioDetailModalProps {
  barrio: Barrio
  onClose: () => void
  onViewOnMap?: (barrio: Barrio) => void
}

export const BarrioDetailModal = ({ 
  barrio: initialBarrio, 
  onClose,
  onViewOnMap,
}: BarrioDetailModalProps) => {
  const { updateBarrio, addBarrio, user, fetchJornadas, addJornada, jornadas } = useBarrioStore()
  
  const isNew = !initialBarrio.id
  
  // Suscripción reactiva al store para evitar datos fantasma tras reset
  const barrio = useBarrioStore(state => 
    state.barrios.find(b => b.id === initialBarrio.id) || initialBarrio
  )

  const [isEditing, setIsEditing] = useState(isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)

  // Estado para el formulario de nueva jornada
  const [newLog, setNewLog] = useState({
    fecha: new Date(),
    agentes: 2,
    horas: 3,
    luminarias: 0,
    observaciones: ''
  })

  const [editData, setEditData] = useState({
    nombre: barrio.nombre,
    estado: barrio.estado,
    observaciones: barrio.observaciones || '',
    agentes: 2,
    horasPorDia: 3,
  })

  useEffect(() => {
    setEditData({
      nombre: barrio.nombre,
      estado: barrio.estado,
      observaciones: barrio.observaciones || '',
      agentes: 2,
      horasPorDia: 3,
    })
    if (barrio.id) fetchJornadas(barrio.id)
  }, [barrio, fetchJornadas])

  const handleSave = async () => {
    if (isNew && !editData.nombre.trim()) {
      setError('El nombre del barrio es obligatorio')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (isNew) {
        await addBarrio({
          nombre: editData.nombre,
          estado: editData.estado,
          progreso: 0,
          observaciones: editData.observaciones,
        })
      } else {
        await updateBarrio(barrio.id, {
          nombre: editData.nombre,
          estado: editData.estado,
          observaciones: editData.observaciones,
        })
      }
      setIsEditing(false)
      if (isNew) onClose()
    } catch (err: any) {
      setError('Error al guardar los cambios. Intente nuevamente.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveJornada = async () => {
    setIsSaving(true)
    try {
      await addJornada({
        barrioId: barrio.id,
        fecha: newLog.fecha,
        agentes: newLog.agentes,
        horas: newLog.horas,
        luminariasRelevadas: newLog.luminarias,
        observaciones: newLog.observaciones,
      })
      setShowLogForm(false)
      setNewLog({
        fecha: new Date(),
        agentes: 2,
        horas: 3,
        luminarias: 0,
        observaciones: ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isEditing, onClose])

  const getEstadoColor = (estado: EstadoBarrio) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-700 border-green-200'
      case 'progreso': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'pausado': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  const getEstadoLabel = (estado: EstadoBarrio) => {
    switch (estado) {
      case 'completado': return 'Completado'
      case 'progreso': return 'En Progreso'
      case 'pausado': return 'Pausado'
      default: return 'Pendiente'
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              {isEditing && isNew ? (
                <input
                  type="text"
                  value={editData.nombre}
                  onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                  placeholder="Nombre del nuevo barrio"
                  className="text-xl font-black text-gray-900 leading-tight border-b-2 border-primary-500 focus:outline-none w-full"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-black text-gray-900 leading-tight">{barrio.nombre}</h2>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-gray-500">{isNew ? 'Nuevo Registro' : `ID: ${barrio.id}`}</p>
                {barrio.superficie_ha && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm font-medium text-primary-600">{barrio.superficie_ha} Ha</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              {!isEditing ? (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(barrio.estado)}`}>
                  {getEstadoLabel(barrio.estado)}
                </span>
              ) : (
                <select
                  value={editData.estado}
                  onChange={(e) => setEditData({ ...editData, estado: e.target.value as EstadoBarrio })}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              )}
            </div>
          </div>

          {/* Luminarias encontradas: dato real, no calculado */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-1">
            <p className="text-sm font-medium text-gray-600">Luminarias encontradas</p>
            <p className="text-3xl font-black text-gray-800">{barrio.luminariasRelevadas?.toLocaleString('es-AR') || 0}</p>
            {barrio.superficie_ha && barrio.luminariasRelevadas ? (
              <p className="text-xs text-gray-400">
                {(barrio.luminariasRelevadas / barrio.superficie_ha).toFixed(1)} lum/Ha
              </p>
            ) : null}
          </div>

          {/* Conteo de Luminarias */}
          <div className="grid grid-cols-2 gap-4">
          {/* Luminarias encontradas y densidad (solo lectura, dato real) */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Luminarias encontradas</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{barrio.luminariasRelevadas || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Conteo real importado</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Densidad</span>
            </div>
            {barrio.superficie_ha && barrio.luminariasRelevadas ? (
              <>
                <p className="text-2xl font-bold text-gray-800">
                  {(barrio.luminariasRelevadas / barrio.superficie_ha).toFixed(1)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">lum / Ha</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin datos</p>
            )}
          </div>
        </div>

          {/* Calculador de Proyección (Solo Admin) */}
          {user?.role === 'admin' && (
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-bold text-primary-800">Proyección de Trabajo</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-primary-600 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Agentes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.agentes}
                    onChange={(e) => setEditData({ ...editData, agentes: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded text-sm font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-primary-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horas/Día
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.horasPorDia}
                    onChange={(e) => setEditData({ ...editData, horasPorDia: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded text-sm font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-primary-100 flex items-center justify-between">
                <span className="text-xs text-primary-700">Días para completar Ha:</span>
                <span className="text-sm font-black text-primary-900 bg-white px-2 py-0.5 rounded border border-primary-200">
                  {calcularDiasRestantes(barrio.superficie_ha || 0, {
                    agentes: editData.agentes,
                    horasPorDia: editData.horasPorDia,
                    velocidadEstimadaHaHora: 0.5 // Base
                  })} días
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Observaciones:</span>
            </div>
            {isEditing ? (
              <textarea
                value={editData.observaciones}
                onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
                placeholder="Añadir notas sobre este barrio..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic">
                {barrio.observaciones || 'Sin observaciones registradas'}
              </div>
            )}
          </div>

          {/* Sección de Jornadas / Libro de Guardia */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <History className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-bold">Libro de Guardia</span>
              </div>
              {user?.role === 'admin' && !showLogForm && (
                <button 
                  onClick={() => setShowLogForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Registrar Día
                </button>
              )}
            </div>

            {showLogForm ? (
              <div className="bg-primary-50 p-4 rounded-xl border border-primary-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-primary-600">Agentes</label>
                    <input 
                      type="number" value={newLog.agentes} 
                      onChange={e => setNewLog({...newLog, agentes: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 rounded border border-primary-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-primary-600">Horas</label>
                    <input 
                      type="number" value={newLog.horas} 
                      onChange={e => setNewLog({...newLog, horas: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 rounded border border-primary-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-black text-primary-600">Luminarias Encontradas</label>
                    <input 
                      type="number" value={newLog.luminarias} 
                      onChange={e => setNewLog({...newLog, luminarias: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 rounded border border-primary-200 text-lg font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="Ej: 25"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowLogForm(false)}
                    className="flex-1 px-4 py-2 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveJornada}
                    disabled={isSaving || newLog.luminarias <= 0}
                    className="flex-none px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? 'Guardando...' : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Finalizar Jornada
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {jornadas.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No hay jornadas registradas para este barrio.
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {jornadas.map((j) => (
                      <div key={j.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between group hover:border-primary-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                            {new Date(j.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">+{j.luminariasRelevadas} <span className="text-[10px] text-gray-400 font-normal">luminarias</span></p>
                            <p className="text-[10px] text-gray-500">{j.agentes} agentes • {j.horas} hs</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          {!isEditing ? (
            <>
              <button 
                onClick={() => onViewOnMap?.(barrio)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MapIcon className="w-4 h-4" />
                Ver en mapa
              </button>
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-300 bg-white"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    {barrio.estado !== 'completado' && (
                      <button 
                        onClick={async () => {
                          if (confirm('¿Marcar este barrio como COMPLETADO? Esto indicará que el relevamiento ha finalizado oficialmente.')) {
                            await updateBarrio(barrio.id, { estado: 'completado' })
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold transition-all shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}
                    <button 
                      onClick={() => setShowTaskModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-all"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Asignar
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-all shadow-sm shadow-primary-200"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      </div>

      {showTaskModal && (
        <TaskAssignmentModal
          barrio={barrio}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  )
}
