import area from '@turf/area'

/**
 * Calcula el área de un feature GeoJSON en Hectáreas
 */
export const calcBarrioArea = (feature: any): number => {
  if (!feature) return 0
  const areaM2 = area(feature)
  return Math.round((areaM2 / 10000) * 100) / 100
}
