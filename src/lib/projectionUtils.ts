/**
 * Utilidades para el cálculo de proyecciones de relevamiento
 */

export interface WorkRhythm {
  agentes: number
  horasPorDia: number
  velocidadEstimadaHaHora: number // Hectáreas por hora/agente (estimado inicial)
}

export const DEFAULT_RHYTHM: WorkRhythm = {
  agentes: 2,
  horasPorDia: 3,
  velocidadEstimadaHaHora: 0.5 // Valor base a calibrar con el weekend pilot
}



/**
 * Calcula los días restantes para completar un área
// ... rest of the file
 * @param superficieRestanteHa Área pendiente en Hectáreas
 * @param rhythm Parámetros de ritmo de trabajo
 * @returns Días estimados (redondeado hacia arriba)
 */
export const calcularDiasRestantes = (
  superficieRestanteHa: number,
  rhythm: WorkRhythm = DEFAULT_RHYTHM
): number => {
  const capacidadDiariaHa = rhythm.agentes * rhythm.horasPorDia * rhythm.velocidadEstimadaHaHora
  if (capacidadDiariaHa <= 0) return 0
  
  return Math.ceil(superficieRestanteHa / capacidadDiariaHa)
}

/**
 * Calcula la velocidad real basada en puntos relevados y tiempo empleado
 * @param puntosCount Cantidad de luminarias encontradas
 * @param horasTotales Horas de hombre empleadas
 * @returns Puntos por hora/agente
 */
export const calcularVelinidadReal = (
  puntosCount: number,
  horasTotales: number
): number => {
  if (horasTotales <= 0) return 0
  return puntosCount / horasTotales
}

/**
 * Calcula proyección de salidas restantes basada en ritmo observado
 * @param metaTotal Luminarias meta (ej: 8000)
 * @param actuales Luminarias relevadas hasta el momento
 * @param ritmoPorSalida Luminarias por salida (ej: 85)
 * @returns Salidas estimadas restantes
 */
export const calcularSalidasRestantes = (
  metaTotal: number,
  actuales: number,
  ritmoPorSalida: number
): number => {
  if (ritmoPorSalida <= 0) return 0
  const restantes = metaTotal - actuales
  return Math.ceil(restantes / ritmoPorSalida)
}

/**
 * Calcula semanas restantes basado en salidas por semana
 * @param salidasRestantes Cantidad de salidas estimadas
 * @param salidasPorSemana Salidas esperadas por semana
 * @returns Semanas estimadas
 */
export const calcularSemanasRestantes = (
  salidasRestantes: number,
  salidasPorSemana: number
): number => {
  if (salidasPorSemana <= 0) return 0
  return Math.ceil(salidasRestantes / salidasPorSemana)
}
