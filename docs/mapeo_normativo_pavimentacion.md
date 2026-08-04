# Mapeo Normativo de Pavimentación - Municipalidad de Chajarí

## Contexto
Este documento contiene la extracción de normativas (Ordenanzas, Decretos, Resoluciones) del Digesto de Chajarí relacionadas con obras de pavimentación en los últimos 10 años. 
El objetivo es que estos datos sirvan como **tabla de referencia** para hacer un cruce (Join) con la capa SIG `calles_segmentadas.csv` y poblar las columnas vacías de la misma.

## Estructura del CSV Objetivo (`calles_segmentadas.csv`)
Las columnas actuales del CSV son:
- `fid`: ID único del segmento.
- `calle` / `nombre`: Nombre de la calle.
- `original_fid`: Feature original sin segmentar.
- `entre_calle_1`: Entrecalle inicial (A completar).
- `entre_calle_2`: Entrecalle final (A completar).
- `tipo_obra`: Tipo de intervención (A completar).
- `longitud_m`: Largo en metros.
- `fecha_aprobacion_concejo`: Fecha de la norma (A completar).
- `fecha_inauguracion`: Fecha de fin de obra/inauguración (A completar).
- `observaciones`: Notas adicionales, tipo de financiamiento, etc. (A completar).

---

## Tabla de Referencia Normativa (Para Cruce)
A continuación, se detallan los tramos de calles identificados en el digesto con su normativa correspondiente. DS debe usar esta tabla para emparejar por `calle` y, de ser posible, por proximidad o mención de `entre_calle_1` / `entre_calle_2`.

| Calle | Desde (Entrecalle) | Hasta (Entrecalle) | Norma | Fecha Aprobación | Fecha Inauguración | Tipo de Obra | Financiamiento / Material | Observaciones |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pablo Stampa** | Presb. Fochesatto | Champagnat | Ordenanza 3293 | 2024 | - | Pavimentación Nueva | Contribución por Mejoras | Declara de interés municipal. |
| **Pablo Stampa** | Virgen del Luján | Presb. Fochesatto | Resolución 028/2007 HCD | 2007 | - | Pavimentación | - | Expediente Nº 286. |
| **Pío XII** | Av. 9 de Julio | Pablo Stampa | Ordenanza 3293 | 2024 | - | Pavimentación Nueva | Contribución por Mejoras | Declara de interés municipal. |
| **Brasil** | Múltiples tramos | Múltiples tramos | Ord. 2980, 3132, 3162, 3208, 3229 | 2018-2023 | - | Pavimentación | Contribución por Mejoras | Planes de pago especiales para frentistas. |
| **Av. 25 de Mayo** | Av. 1° de Mayo | Güemes | Ordenanza (PDF 3442) | - | - | Obra Pública Municipal | Administración | "Dispónese construir como Obra Pública Municipal". |
| **Av. 25 de Mayo** | Pablo Stampa | Pancho Ramírez | Ordenanza (PDF 3609) | - | - | Obra Pública Municipal | Administración | Obra por administración. |
| **Av. José Iglesias** | Av. Alem | Sarmiento | - | - | 2025 (En ejecución) | Pavimentación | Hormigón | Obra en ejecución (2025). |
| **Av. Siburu** | Av. 1 de Mayo | Av. 28 de Mayo | - | - | Mayo 2020 | Pavimentación Urbana | - | Inaugurada en Mayo 2020. 270m por calzada. |
| **Av. Almirante Brown**| Múltiples tramos | Múltiples tramos | - | - | - | Pavimentación / Repav. | Hormigón | Doble calzada, cantero central y desagües. |
| **Ángel Repetto** | Brasil | Av. Almirante Brown | Proyecto de Ordenanza | 2023 | - | Pavimentación | - | Unión de pavimento de Av. Almirante Brown con calle Brasil. |
| **Presb. Fochesatto** | Av. 1° de Mayo | Coronel T. de Rocamora| Ordenanza / Licitación 13/2025| 2025 | Sept. 2025 | Pavimentación | Hormigón | Presupuesto $55M. Inauguradas 2 cuadras en Sept 2025. |
| **Guarumba** | Av. Alem | Av. Belgrano | - | - | 2026 (En ejecución) | Pavimentación Continua | - | Completando el pavimento de calle Guarumba (5 cuadras). |
| **Champagnat** | Av. Belgrano | Av. Siburu | - | - | 2022 | Pavimentación | Hormigón | Finalizaron los trabajos en 2022. |
| **Champagnat** | 9 de Julio | Pancho Ramírez | - | - | Marzo 2021 | Pavimentación | Hormigón | Comenzó el colado de hormigón en Marzo 2021. |
| **Córdoba** | Estrada | Guarumba | Proyecto de Ordenanza | Oct. 2025 | - | Pavimentación | - | Declarando de Interés General la obra. |
| **San Luis** | Estrada | Guarumba | Ordenanza 3182 | 28/08/2025 | - | Pavimentación Urbana | - | Declara de interés municipal. |
| **Antártida** | Estrada | Guarumba | Ordenanza 3199 | 09/10/2025 | - | Pavimentación | - | Declarar de Interés Municipal obra de pavimento. |
| **Av. H. Yrigoyen** | Champagnat | Av. Belgrano | Ordenanza | 2022 | - | Pavimentación | - | Declarando de Interés General de pavimentación. |

---

## Instrucciones para el Cruce (Join) en DeepSeek

1. **Estrategia de Matcheo:**
   - El cruce principal debe hacerse por la columna `calle` (o `nombre`).
   - Dado que una misma calle puede tener múltiples tramos con diferentes normativas (ej. *Pablo Stampa* o *Av. 25 de Mayo*), si el CSV original no tiene las `entre_calle_1` y `entre_calle_2` pobladas, **no forzar un matcheo ciego**. Es preferible dejar la `observaciones` con un resumen de todas las normativas de esa calle, o crear una tabla intermedia en Supabase (`calles_normas`) con relación 1:N.
   - Si se logra poblar `entre_calle_1` y `entre_calle_2` en el CSV, usarlas para hacer el matcheo exacto de tramo.

2. **Actualización de Columnas:**
   - `fecha_aprobacion_concejo`: Llenar con la "Fecha Aprobación" de la tabla de referencia (formato sugerido: `YYYY-MM-DD` o `YYYY` si es solo el año).
   - `fecha_inauguracion`: Llenar con la "Fecha Inauguración" si la obra ya está finalizada.
   - `tipo_obra`: Llenar con "Pavimentación Nueva", "Repavimentación", "Obra Pública Municipal", etc.
   - `observaciones`: Concatenar el "Financiamiento" y las "Observaciones" de la tabla de referencia (ej. *"Ord. 3293/2024 - Contribución por Mejoras - Interés municipal"*).

3. **Próximos Pasos:**
   - Generar el script en Python/SQL para procesar el `calles_segmentadas.csv` y aplicar estas reglas.
   - Si se requiere normalizar los nombres de las calles (ej. "Avenida 9 de Julio" vs "9 de Julio", o "Presbítero Fochesatto" vs "Fochesatto"), aplicar un script de limpieza de strings (fuzzy matching o diccionario de alias) antes del cruce.