/**
 * Constantes centralizadas para el proyecto GIS Municipal
 * Evita duplicación de lógica entre componentes
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================================================
// UTILIDADES DE CLASES
// ============================================================================

/**
 * Combina clases de Tailwind de forma inteligente
 * @example cn('text-red-500', 'bg-white') => 'text-red-500 bg-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// ESTADOS DE BASE DE LUMINARIAS
// ============================================================================

/**
 * Opciones de estado de base para luminarias
 * Se usa en filtros de mapa y formularios
 */
export const ESTADO_BASE_OPTIONS = [
  { value: 'ok', label: 'En buenas condiciones', color: 'bg-green-500' },
  { value: 'malas', label: 'Deteriorada / Mala', color: 'bg-red-500' },
  { value: 'sin_base', label: 'Sin base', color: 'bg-yellow-400' },
] as const

export type EstadoBase = (typeof ESTADO_BASE_OPTIONS)[number]['value']

// ============================================================================
// ESTADOS DE BARRIOS
// ============================================================================

export const ESTADO_BARRIO_COLORS = {
  pendiente: '#9ca3af',    // gris
  progreso: '#f59e0b',     // naranja
  completado: '#10b981',   // verde
  pausado: '#ef4444',      // rojo
} as const

// ============================================================================
// CONFIGURACIÓN DE MAPA
// ============================================================================

export const MAP_CONFIG = {
  // Centro inicial (Chajarí, Entre Ríos)
  CENTER: [-30.7516, -57.9872] as [number, number],

  // Zoom levels
  ZOOM_DEFAULT: 13,
  ZOOM_MIN: 11,
  ZOOM_MAX: 19,

  // Capas disponibles
  LAYERS: {
    BARRIOS: 'barrios',
    LUMINARIAS: 'luminarias',
    HEATMAP: 'heatmap',
  },

  // Mapas base
  BASE_MAPS: {
    OSM: 'osm',
    SATELLITE: 'satellite',
  },
} as const

// ============================================================================
// CONFIGURACIÓN DE PROYECTO
// ============================================================================

export const PROJECT_CONFIG = {
  // Usuario admin se determina por email
  ADMIN_EMAIL: 'a.m.saposnik@gmail.com',

  // Nombre del proyecto
  NAME: 'Gestión de Relevamientos Municipales',

  // Autor/coordinador
  COORDINATOR: 'Alejandro Saposnik',

  // Estimación de luminarias por hectárea (default)
  LUMINARIAS_POR_HA: 4,
} as const

// ============================================================================
// FORMATOS DE FECHA
// ============================================================================

export const DATE_FORMATS = {
  // Format corto: 27/03/26
  SHORT: 'dd/MM/yy',

  // Format completo con hora: 27/03/26 14:30
  WITH_TIME: 'dd/MM/yy HH:mm',

  // Format legible: 27 de marzo de 2026
  LONG: 'dd "de" MMMM "de" yyyy',

  // Format relativo: 27/03 a las 14:30
  RELATIVE: "dd/MM 'a las' HH:mm",
} as const
