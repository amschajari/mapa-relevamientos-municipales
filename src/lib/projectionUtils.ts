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
 * Calcula el total estimado de luminarias de forma adaptativa.
 * Si hay datos reales (relevadas y superficie cubierta), calcula la densidad real.
 * Si no, usa una densidad base (8 por Ha / 1 por manzana).
 * @param superficieTotalHa Superficie total del barrio
 * @param superficieCubiertaHa Superficie que ya fue relevada (estimada por progreso)
 * @param relevadasCount Luminarias encontradas hasta el momento
 * @param densidadBase Densidad por defecto (8 lúmenes/Ha)
 * @returns Total estimado sugerido
 */
export const calcularEstimadoAdaptive = (
  superficieTotalHa: number,
  superficieCubiertaHa: number,
  relevadasCount: number,
  densidadBase: number = 4
): number => {
  if (superficieTotalHa <= 0) return 0

  // Si tenemos una muestra significativa (ej: > 10% del barrio o > 1 Ha)
  // calculamos la densidad real observada.
  if (superficieCubiertaHa > 0 && relevadasCount > 0) {
    const densidadReal = relevadasCount / superficieCubiertaHa
    return Math.round(superficieTotalHa * densidadReal)
  }

  // Si no hay datos reales, usamos la densidad base
  return Math.round(superficieTotalHa * densidadBase)
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
