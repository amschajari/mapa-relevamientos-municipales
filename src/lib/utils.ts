import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// NORMALIZACIÓN DE VALORES DE CATÁLOGO (Odoo WEBHOOK vs IMPORTADOR)
// ============================================================================
// El webhook guarda los valores técnicos de Odoo en minúscula (ej: "sin base",
// "aereo", "led 150w") mientras el importador los guarda en formato catálogo
// ("Sin base", "Aéreo", "LED 150W"). Esta función unifica la presentación.

const CLAVE_CANONICA: Record<string, string> = {
  'sin base': 'Sin base',
  'con base en buenas condiciones': 'Con base en buenas condiciones',
  'con base en malas condiciones': 'Con base en malas condiciones',
  aereo: 'Aéreo',
  subterraneo: 'Subterráneo',
  'no se puede identificar': 'No se puede identificar',
  no_identificable: 'No identificable',
  led: 'LED',
  sodio: 'Sodio',
  otro: 'Otro',
};

const normalizarClave = (val: string): string =>
  val.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Formatea un valor de catálogo (tipo, cableado, estado base) a su
 * representación canónica. Ejemplos:
 *  "sin_base"  -> "Sin base"
 *  "aereo"     -> "Aéreo"
 *  "led 150w"  -> "LED 150W"
 *  "sodio 150W"-> "Sodio 150W"
 */
export function formatearValorCatalogo(val?: string | null): string {
  if (!val) return ''
  const v = val.trim()
  if (!v) return ''

  const clave = normalizarClave(v)
  if (CLAVE_CANONICA[clave]) return CLAVE_CANONICA[clave]

  // Tipo: capitalizar palabras, mantener acrónimos/vatios en mayúscula
  return v
    .split(/\s+/)
    .map(palabra => {
      const conVatios = palabra.match(/^(\d+)\s*w$/i)
      if (conVatios) return `${conVatios[1]}W`
      if (palabra.toLowerCase() === 'led') return 'LED'
      const baja = palabra.toLowerCase()
      return baja.charAt(0).toUpperCase() + baja.slice(1)
    })
    .join(' ')
}
