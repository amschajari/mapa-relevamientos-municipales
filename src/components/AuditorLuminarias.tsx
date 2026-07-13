import { useMemo, useState } from 'react'
import { AlertCircle, Search, Download, X } from 'lucide-react'
import { cn } from '@/lib/constants'
import type { RegistroPreview } from './ImportadorDatos'

export type AuditFilter = 'all' | 'invalidos' | 'sin-id' | 'sin-coords' | 'coord-cero' | 'duplicados' | 'duplicados-global' | 'dedup-perdida'

interface AuditRecord extends RegistroPreview {
  duplicado: boolean
  duplicadoGlobal: boolean
}

interface Props {
  records: RegistroPreview[]
  isImporting: boolean
  importMode: 'merge' | 'replace'
  onImportModeChange: (mode: 'merge' | 'replace') => void
  onImport: () => void
  onCancel: () => void
}

function enrichRecords(records: RegistroPreview[]): AuditRecord[] {
  const audit = records.map(r => ({ ...r, duplicado: false, duplicadoGlobal: false }))

  for (let i = 1; i < audit.length; i++) {
    const prev = audit[i - 1]
    const curr = audit[i]
    if (prev.nombre && curr.nombre && prev.nombre === curr.nombre && prev.nombre !== '(Sin ID)') {
      prev.duplicado = true
      curr.duplicado = true
    }
  }

  const idsGlobal: Record<string, number> = {}
  audit.forEach((r, i) => {
    if (r.nombre && r.nombre !== '(Sin ID)') {
      if (idsGlobal[r.nombre] !== undefined) {
        r.duplicadoGlobal = true
        audit[idsGlobal[r.nombre]].duplicadoGlobal = true
      } else {
        idsGlobal[r.nombre] = i
      }
    }
  })

  return audit
}

export { enrichRecords }
export type { AuditRecord }

const FILTER_LABELS: Record<AuditFilter, string> = {
  all: 'Todos',
  invalidos: 'Solo inválidos',
  'sin-id': 'Sin ID',
  'sin-coords': 'Sin coordenadas',
  'coord-cero': 'Coords = 0',
  duplicados: 'Duplicados consecutivos',
  'duplicados-global': 'Duplicados totales',
  'dedup-perdida': 'Perdidos por dedup',
}

export const AuditorLuminarias = ({
  records,
  isImporting,
  importMode,
  onImportModeChange,
  onImport,
  onCancel,
}: Props) => {
  const auditRecords = useMemo(() => enrichRecords(records), [records])
  const [filter, setFilter] = useState<AuditFilter>('all')
  const [search, setSearch] = useState('')

  const validos = auditRecords.filter(r => r.valido && !r.duplicadoGlobal)
  const invalidos = auditRecords.filter(r => !r.valido)
  const sinId = auditRecords.filter(r => !r.nombre || r.nombre === '(Sin ID)')
  const sinCoords = auditRecords.filter(r => r.nombre && r.nombre !== '(Sin ID)' && (isNaN(r.lat) || isNaN(r.lng)))
  const coordCero = auditRecords.filter(r => (r.lat === 0 || r.lng === 0) && r.nombre && r.nombre !== '(Sin ID)')
  const duplicados = auditRecords.filter(r => r.duplicado)
  const duplicadosGlobal = auditRecords.filter(r => r.duplicadoGlobal)

  const idsUnicos = new Set(duplicadosGlobal.map(r => r.nombre))
  const perdidosPorDedup = duplicadosGlobal.length - idsUnicos.size

  let filtrados = auditRecords
  if (filter === 'invalidos') filtrados = invalidos
  else if (filter === 'sin-id') filtrados = sinId
  else if (filter === 'sin-coords') filtrados = sinCoords
  else if (filter === 'coord-cero') filtrados = coordCero
  else if (filter === 'duplicados') filtrados = duplicados
  else if (filter === 'duplicados-global') filtrados = duplicadosGlobal
  else if (filter === 'dedup-perdida') {
    filtrados = duplicadosGlobal.filter(r => {
      const primero = auditRecords.findIndex(x => x.nombre === r.nombre)
      return auditRecords.indexOf(r) !== primero
    })
  }

  if (search) {
    const q = search.toLowerCase()
    filtrados = filtrados.filter(r =>
      r.nombre.toLowerCase().includes(q) ||
      (r.propiedades.direccion || '').toLowerCase().includes(q) ||
      r.barrio.toLowerCase().includes(q)
    )
  }

  const stats = [
    { key: 'all', label: 'Válidos', value: validos.length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { key: 'invalidos', label: 'Inválidos', value: invalidos.length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { key: 'sin-id', label: 'Sin ID', value: sinId.length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { key: 'duplicados', label: 'Duplicados consec.', value: duplicados.length, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { key: 'duplicados-global', label: 'Duplicados totales', value: duplicadosGlobal.length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { key: 'total', label: 'Total registros', value: auditRecords.length, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  ] as const

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="flex gap-3 flex-wrap">
        {stats.map(s => (
          <button
            key={s.key}
            onClick={() => s.key !== 'total' && setFilter(s.key as AuditFilter)}
            disabled={s.key === 'total'}
            className={cn(
              'flex-1 min-w-[130px] p-3 rounded-xl border text-left transition-all',
              s.bg, s.border,
              s.key !== 'total' && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
              filter === s.key && 'ring-2 ring-blue-500',
            )}
          >
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Dedup Banner */}
      {perdidosPorDedup > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>{perdidosPorDedup}</strong> registro{perdidosPorDedup > 1 ? 's' : ''} se perderá{perdidosPorDedup > 1 ? 'n' : ''} al importar porque comparte{perdidosPorDedup > 1 ? 'n' : ''} ID con otro. Revisá "Duplicados totales" y "Perdidos por dedup".
          </p>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as AuditFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium',
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
        <div className="relative ml-auto min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID, dirección o barrio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2.5 text-gray-500 font-medium w-8">Est.</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">ID Luminaria</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Dirección</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Barrio</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Latitud</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Longitud</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Tipo</th>
                <th className="text-left p-2.5 text-gray-500 font-medium">Error / Advertencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.slice(0, 200).map((r, i) => {
                let rowClass = ''
                let msg = r.error || ''

                if (r.duplicado) {
                  rowClass = 'bg-orange-50'
                  if (!msg) msg = 'ID duplicado consecutivo'
                } else if (r.duplicadoGlobal) {
                  rowClass = 'bg-red-50'
                  if (!msg) msg = 'ID duplicado global'
                } else if (!r.valido && r.error === 'Fila vacía') {
                  rowClass = 'bg-yellow-50'
                } else if (!r.valido) {
                  rowClass = 'bg-red-50'
                }

                return (
                  <tr key={i} className={rowClass}>
                    <td className="p-2.5">{r.valido ? '✓' : '✗'}</td>
                    <td className="p-2.5 font-mono text-gray-800 font-medium">{r.nombre}</td>
                    <td className="p-2.5 text-gray-600">{r.propiedades.direccion || '-'}</td>
                    <td className="p-2.5 text-gray-600">{r.barrio || '-'}</td>
                    <td className="p-2.5 text-gray-600">{isNaN(r.lat) ? 'N/A' : r.lat}</td>
                    <td className="p-2.5 text-gray-600">{isNaN(r.lng) ? 'N/A' : r.lng}</td>
                    <td className="p-2.5 text-gray-600">{r.propiedades.tipo || '-'}</td>
                    <td className={cn('p-2.5', msg ? 'text-red-600' : '')}>{msg || '-'}</td>
                  </tr>
                )
              })}
              {filtrados.length > 200 && (
                <tr>
                  <td colSpan={8} className="p-3 text-center text-gray-400 text-xs">
                    ... y {filtrados.length - 200} más (usá los filtros o búsqueda)
                  </td>
                </tr>
              )}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 text-xs">
                    No hay registros que coincidan con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Mode + Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-blue-50/50 border-b border-blue-100">
          <label className="text-sm font-semibold text-blue-900 block mb-2">Modo de Importación</label>
          <div className="flex gap-4">
            <button
              onClick={() => onImportModeChange('replace')}
              className={cn(
                "flex-1 p-3 rounded-xl border-2 transition-all text-left",
                importMode === 'replace'
                  ? "border-blue-500 bg-white shadow-sm ring-2 ring-blue-500/20"
                  : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100",
              )}
            >
              <p className="font-bold text-sm text-blue-700">Reemplazar Barrios (Default)</p>
              <p className="text-[11px] leading-tight mt-0.5">Limpia las luminarias viejas de los barrios incluidos e inserta las nuevas.</p>
            </button>
            <button
              onClick={() => onImportModeChange('merge')}
              className={cn(
                "flex-1 p-3 rounded-xl border-2 transition-all text-left",
                importMode === 'merge'
                  ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20"
                  : "border-gray-200 bg-gray-50 text-gray-400 opacity-60 hover:opacity-100",
              )}
            >
              <p className="font-bold text-sm text-amber-700">Mezclar (Update/Insert)</p>
              <p className="text-[11px] leading-tight mt-0.5">Suma los puntos nuevos y actualiza los existentes sin borrar nada previo.</p>
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onImport}
            disabled={isImporting || validos.length === 0}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Importar {validos.length} puntos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
