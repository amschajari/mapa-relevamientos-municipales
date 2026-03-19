# Estrategia de Integridad: Odoo <=> GIS

Este documento detalla la jerarquía de datos y el flujo de trabajo para la integración de relevamientos entre el sistema administrativo (Odoo) y el visor geográfico (GIS).

---

## 1. Integridad: Estrategia de Etiquetas (Label Matching)

En esta fase inicial, el **GIS actúa como un visor administrativo enriquecido**. La integridad se basa en la etiqueta `Barrio` proveniente de Odoo:

- **Matching por Nombre**: El sistema normaliza el texto (quita acentos y espacios) para asignar el `barrio_id` correcto basándose en el nombre escrito en el CSV.
### 🚀 Hito: Validación Operativa (San Clemente)
- **Resultado**: EXITO. El sistema procesó el CSV de Odoo asignando puntos correctamente por nombre de barrio y permitió la oficialización masiva a Supabase sin errores de esquema.
- **Lección**: La independencia de la carga respecto a la geometría (`Label Over Geometry`) es el camino más rápido y estable para la fase de relevamiento masivo.
- **Detección Espacial Latente**: Los polígonos GeoJSON se usan para visualización y auditoría visual, pero no bloquean la carga de puntos si un dato administrativo difiere de la ubicación física.
- **Verdad Administrativa**: Mandan las etiquetas de Odoo. El GIS añade la capa de visualización técnica (ubicación, cableado, estado).

## 2. Gestión de Estados

Para evitar dependencias complejas y errores de precisión:
- El **Estado del Barrio** (Pendiente, Progreso, Completo) es un campo de gestión manual.
- El coordinador actualiza el estado basándose en el reporte de jornadas, no automáticamente por la cantidad de puntos cargados.

---

## 3. Mapeo de Campos Odoo (Soportados)

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
