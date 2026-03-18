# Estrategia de Integridad: Odoo <=> GIS

Este documento detalla la jerarquía de datos y el flujo de trabajo para la integración de relevamientos entre el sistema administrativo (Odoo) y el visor geográfico (GIS).

---

## 1. La "Verdad Geográfica" (Geometry over Label)

Dado que los registros manuales en Odoo pueden contener errores de asignación de barrio, el GIS actúa como **Validador de Campo**:

1. **Detección por Ubicación**: El importador usa `Turf.js` para detectar en qué polígono cae cada luminaria.
2. **Prioridad GIS**: Si un punto cae físicamente en el Barrio B, el sistema lo asocia a ese barrio, ignorando si la etiqueta de Odoo decía "Barrio A".
3. **Alertas Visuales**: Los puntos con discrepancia (Odoo ≠ GIS) se marcan con un ícono de advertencia ⚠️ en el visor para revisión del coordinador.

---

## 2. Mapeo de Campos Odoo (Soportados)

El importador actual (`ImportadorDatos.tsx`) captura los siguientes atributos del CSV de Odoo y los almacena en el campo `propiedades` (JSONB):

| Campo Odoo | Propiedad GIS | Uso en el Mapa |
| :--- | :--- | :--- |
| `ID Luminaria` | `nombre` (Raíz) | Título del Popup e Identificador único. |
| `Apagada/Encendida` | `sin_luz` (Boolean) | Dispara alerta visual de **Punto Apagado**. |
| `Medidor` | `medidor` | Se muestra en el popup si tiene contenido. |
| `Tipo Luminaria` | `tipo` | Características técnicas (LED, SAP, etc). |
| `Tipología Luminaria`| `tipologia` | Sub-categoría técnica. |
| `Tipo de Cableado`| `cableado` | Aéreo, Subterráneo, etc (con ícono 🔌). |
| `Observación` | `observacion` | Se muestra como nota resaltada en el popup. |
| `Dirección` | `direccion` | Referencia catastral o postal. |

---

## 3. Manejo de Puntos "Sin Barrio"

Todo punto que caiga fuera de los polígonos oficiales durante la importación:
- Se asigna al "balde" de **Sin Barrio**.
- Deberá ser re-procesado una vez que se carguen los polígonos finales de alta resolución.

---

## 4. Próximos Pasos (Mañana en Oficina)

- [ ] **Sincronización de Polígonos**: Subir el nuevo archivo GeoJSON con los límites definitivos (sin solapamientos).
- [ ] **Prueba de Fuego**: Importar el CSV de Odoo con registros reales (`LedSantaFe`) y verificar la asignación automática por ubicación.
- [ ] **Análisis de Discrepancias**: Revisar puntos con alerta ⚠️ para corregir el dato maestro en Odoo si es necesario.
