/**
 * Utilidades para el manejo de datos en el mapa
 */

/**
 * Calcula la fecha de la última actualización basada en un conjunto de puntos
 * @param points Array de puntos oficiales con campos created_at o updated_at
 * @returns Date o null si no hay datos
 */
export function calculateLastUpdate(points: any[] | null | undefined): Date | null {
  if (!points || points.length === 0) return null
  
  const dates = points
    .map((p: any) => p.created_at || p.updated_at)
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime())
    
  if (dates.length === 0) return null
  
  return new Date(Math.max(...dates))
}
