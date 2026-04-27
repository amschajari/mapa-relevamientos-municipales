# Contexto: Módulo Calles Pavimentadas – Proyecto GIS Municipal Chajarí

## Descripción general del proyecto

Se está desarrollando una interfaz web tipo **mapa interactivo GIS / IDE** para gestión municipal de la ciudad de Chajarí, Entre Ríos, Argentina. El proyecto utiliza **Supabase** como backend (PostgreSQL + PostGIS) y un mapa interactivo en el frontend. Este documento describe específicamente el módulo de **calles pavimentadas**.

---

## Estado actual de los datos

### Fuente original
- Archivo shapefile exportado como GeoJSON: `calles_ejido_reordenado.geojson`
- Subido a una tabla en Supabase
- **875 features** (tramos), **197 nombres únicos de calles**
- Geometría: `MultiLineString`, CRS: `WGS84 (EPSG:4326)`
- Campos actuales: solo `name` (string) y `fid` (integer)

### Problema estructural principal
Los tramos en el GeoJSON representan calles **completas de punta a punta**, no cuadra por cuadra. Esto hace imposible categorizar con precisión el estado de pavimentación, ya que una misma calle puede estar pavimentada en algunos tramos entre intersecciones y no en otros.

**Ejemplo concreto:** La calle Guarumba viene como un único feature que abarca desde el suroeste de Av. Siburu hasta el otro extremo, pero solo el tramo entre Av. Siburu y Av. Belgrano NO está pavimentado. Con la estructura actual, no se puede etiquetar ese tramo por separado.

### Pre-clasificación realizada
Se construyó una clasificación inicial basada en análisis visual del plano de pavimentación existente (`pavimentoexistente_001.png`), con tres categorías:

| Categoría | Nombres únicos | Tramos (features) |
|---|---|---|
| `pavimentado` | ~99 | ~712 |
| `no_pavimentado` | ~58 | ~75 |
| `sin_datos` | ~40 | ~88 |

Se generó una herramienta HTML interactiva (`categorizador_calles_chajari.html`) con mapa Leaflet + OSM que permite visualizar, filtrar y editar esta clasificación, y exportar el GeoJSON resultante.

> **Importante:** El GeoJSON original contiene tanto calles pavimentadas como no pavimentadas. La pre-clasificación fue un paso exploratorio. El GeoJSON final deberá contener **únicamente las calles pavimentadas**; los segmentos no pavimentados se eliminan del conjunto de datos.

---

## Trabajo pendiente – Editor de tramos por cuadra

### Objetivo
Transformar los tramos actuales (calle completa) en **segmentos cuadra a cuadra** (de intersección a intersección), para poder etiquetar con precisión qué cuadras específicas están pavimentadas.

### Enfoque técnico definido

**Paso 1 – Segmentación automática por intersecciones**
Usar **Shapely** (Python) para:
1. Detectar todos los puntos donde dos geometrías de calle se intersectan
2. Cortar cada `MultiLineString` en esos puntos
3. Generar un nuevo GeoJSON con un feature por cuadra (resultado estimado: 2000–4000 features)

**Paso 2 – Editor interactivo (HTML v2)**
Construir sobre la v1 (`categorizador_calles_chajari.html`) incorporando:

- **Herramienta de corte manual (break point):** clic sobre un tramo en el mapa para insertar un punto de corte arbitrario y dividirlo en dos features independientes.
- **Herramienta de eliminación:** clic sobre un segmento para descartarlo del dataset (es un tramo no pavimentado, un error geométrico, o un pasaje que no corresponde registrar). Los segmentos eliminados no aparecen en el export final.
- **Formulario de atributos por tramo:** al seleccionar un segmento a conservar, panel lateral para completar `tipo_obra`, `fecha_aprobacion_concejo`, `fecha_inauguracion`, `entre_calle_1`, `entre_calle_2`, `observaciones`.
- **Flujo de trabajo claro:** cada segmento tiene dos destinos posibles — **conservar y completar atributos** (pavimentado) o **eliminar** (no pavimentado / no corresponde).

El GeoJSON exportado por la v2 contiene **únicamente los segmentos conservados**, con todos sus atributos. Es el archivo final listo para importar a Supabase.

Esto cubre los casos donde la geometría no registró correctamente la intersección o donde el cambio de pavimento ocurre en el medio de una cuadra.

### Notas de implementación
- La segmentación automática puede generar artefactos por tolerancia de coordenadas (diferencias de milímetros). Se debe aplicar un buffer de tolerancia (ej. `1e-6` grados) al detectar intersecciones.
- El editor de corte manual es considerado **parte esencial del flujo**, no opcional.
- El GeoJSON resultante debe ser compatible para importar directamente a la tabla Supabase existente.

---

## Esquema de datos – Campos requeridos por feature

Cada tramo (cuadra) del GeoJSON final debe contener los siguientes campos en `properties`:

```json
{
  "name": "Nombre de la calle",
  "fid": 1,
  "calle": "Nombre de la calle",
  "entre_calle_1": "Nombre de calle en un extremo del tramo",
  "entre_calle_2": "Nombre de calle en el otro extremo del tramo",
  "tipo_obra": "Hormigón | Pavimento asfáltico",
  "fecha_aprobacion_concejo": "DD-MM-AAAA | null",
  "fecha_inauguracion": "DD-MM-AAAA | null",
  "observaciones": "texto libre | null"
}
```

### Notas sobre los campos
- **No existe un campo `pavimento`**: la presencia del feature en el dataset ya implica que está pavimentado. Los segmentos no pavimentados se eliminan del editor y no llegan al GeoJSON final ni a Supabase.
- `entre_calle_1` y `entre_calle_2`: identifican el tramo con precisión como "Calle X entre Calle A y Calle B". En la segmentación automática se pueden intentar poblar detectando qué calles intersectan cada extremo del segmento, aunque puede requerir revisión manual.
- `tipo_obra`: valores posibles `"Hormigón"` o `"Pavimento asfáltico"`. Campo obligatorio para cada tramo conservado.
- `fecha_aprobacion_concejo`: fecha de aprobación de la obra en el Concejo Deliberante. Formato `DD-MM-AAAA`. Puede ser nulo si no se dispone del dato.
- `fecha_inauguracion`: fecha de inauguración/habilitación de la obra. Formato `DD-MM-AAAA`. Puede ser nulo.
- El objetivo de gestión es **priorizar y registrar obras de los últimos 10 años** (recapados H°A°, bacheos, pavimentos nuevos).

---

## Infraestructura

| Componente | Tecnología |
|---|---|
| Base de datos | Supabase (PostgreSQL + PostGIS) |
| Tabla actual | calles_ejido (≈880 registros) |
| Índice espacial | GIST recomendado sobre columna geometry |
| Frontend mapa | (definir: Leaflet / Mapbox / MapLibre) |
| Herramienta edición | HTML standalone con Leaflet + JS |
| Procesamiento GIS | Python + Shapely |

### Sobre la escala de datos
La segmentación cuadra a cuadra llevará los ~880 features actuales a un estimado de **2000–4000 features**. Esto es perfectamente manejable para Supabase/PostGIS y para renderización en el frontend (el límite práctico en navegador es ~50.000 geometrías simples). No se requieren cambios de arquitectura.

---

## Archivos de referencia

| Archivo | Descripción |
|---|---|
| `calles_ejido_reordenado.geojson` | GeoJSON original (875 features, sin campo pavimento) |
| `pavimentoexistente_001.png` | Plano de pavimentación existente usado como referencia visual |
| `categorizador_calles_chajari.html` | Herramienta HTML interactiva de categorización (v1, sin editor por cuadras) |
| `calles_chajari_pavimentacion.csv` | Export CSV con clasificación inicial por nombre de calle |

---

## Próximos pasos en orden

1. **Script Python de segmentación automática** – cortar tramos en intersecciones con Shapely, generar nuevo GeoJSON con los campos del esquema definido (sin datos de pavimentación aún, solo geometría segmentada).
2. **Validación visual** del GeoJSON segmentado sobre el mapa, verificar que los cortes por cuadra sean correctos.
3. **Editor HTML v2** – basado en `categorizador_calles_chajari.html`, incorporar: herramienta de corte manual (break point), herramienta de eliminación de segmentos, y formulario de atributos por tramo. Pasarle al agente ambos archivos: este `.md` + el `.html` v1.
4. **Carga y depuración** – recorrer los segmentos en el editor, eliminar los no pavimentados, completar atributos de los pavimentados.
5. **Exportar GeoJSON final** – solo segmentos pavimentados con atributos completos.
6. **Importación a Supabase** – reemplazar tabla actual con los nuevos features.
7. **Integración con mapa interactivo municipal** – conectar la capa al proyecto GIS principal.

## Handoff al agente dev

Para retomar el trabajo, compartir al agente:
- Este archivo `.md` (contexto completo de negocio y decisiones de diseño)
- `categorizador_calles_chajari.html` (v1, base de código con GeoJSON embebido y lógica Leaflet)

El HTML contiene embebidos el GeoJSON completo de 875 features y toda la lógica de la herramienta v1, por lo que el agente tiene contexto técnico completo leyendo ambos archivos.
