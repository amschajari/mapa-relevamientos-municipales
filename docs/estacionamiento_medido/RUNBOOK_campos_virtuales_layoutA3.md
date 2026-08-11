# Runbook — Campos virtuales + Capa de centros SVG + Layouts A3/A1

**Capa:** `relevamiento_em_P07F6_ALE` (proyecto `estacionamiento_medido.qgs`)
**Estado:** los 3 campos virtuales ya están inyectados en el `.qgs` (ver Parte 0). Layout de presentación: **A1**. Lo que resta en QGIS es simbología + capa de puntos + ajuste del layout.

---

## Parte 0 — Campos virtuales (YA aplicados al proyecto)

Los 3 campos virtuales ya fueron agregados al `estacionamiento_medido.qgs` (en ambas instancias de la capa):

| Campo | Tipo | Expresión |
|---|---|---|
| `longitud_geom` | decimal | `round(length($geometry)/0.5,0)*0.5` |
| `plazas_auto` | entero | `if("tipo" = 'autos', floor("longitud_geom" / 5.5) + if("longitud_geom" >= 4.5 AND "longitud_geom" < 5.5 AND floor("longitud_geom" / 5.5) = 0, 1, 0), NULL)` |
| `plazas_auto_frac` | decimal | `if("tipo" = 'autos', "longitud_geom" / 5.5, NULL)` |

**Regla de plazas (revisada 10/08):**
- Tramo ≥ 5.5 m → `floor(larg/5.5)` plazas.
- Tramo entre **4.5 m y 5.5 m** → cuenta **1 plaza** (cabe un auto compacto; ej. el tramo de 5.2 m que antes daba 0).
- Tramos < 4.5 m o `tipo ≠ autos` → `NULL`.
- **Total del sector: 201 plazas** (antes 200 con floor estricto). ⚠️ Pendiente validar con el jefe.

Al abrir el proyecto en QGIS se ven en la tabla de atributos; motos/prohibido quedan `NULL`.

---

## Parte 1 — Simbología del mapa (líneas)

1. Panel **Capas** → doble clic en `relevamiento_em_P07F6_ALE` → **Simbología**.
2. Desplegable superior → **"Categorizado"**, columna `tipo` → **Clasificar**.
3. Colores y grosor (clic en cada símbolo):
   - `autos` → **verde** (`#2e7d32`), grosor **1.2 mm** (protagonistas).
   - `motos` → gris (`#9e9e9e`), 0.8 mm.
   - `prohibido` → rojo (`#c62828`), 0.6 mm.
4. **Etiquetas** → "Etiquetas simples" → expresión:
   ```
   concat("fid", ' — ', round("longitud_geom",1), 'm (', coalesce(to_string("plazas_auto"),'–'), ')')
   ```
   → se ve p.ej. `5 — 9.0m (1)`. El `–` = moto/prohibido.
5. Aplicar.

---

## Parte 2 — Capa de centros con símbolos SVG (para leyenda)

Objetivo: un **punto a mitad de cada segmento**, simbolizado con el SVG que corresponda (auto / moto / prohibido), superpuesto sobre las líneas. Usado como referencia visual y en la leyenda del layout.

**La capa `relevamiento_em_centros.geojson` ya está generada** (76 puntos, EPSG:5348, punto a mitad de recorrido sobre la línea — verificado a 0.000 m de distancia).

En QGIS:

1. **Agregar la capa:** clic derecho en el panel Capas → **"Agregar capa" → "Agregar capa vectorial"** → elegir `docs/estacionamiento_medido/relevamiento_em_centros.geojson`. Se superpondrá sin reproyectar (mismo CRS).
2. Propiedades → **Simbología** → **"Categorizado"**, columna `tipo`, **Clasificar**.
3. Simbolizar cada categoría con un **Marcador SVG** (marcador → tipo de símbolo → "Marcador SVG"):
   - `autos` → **car (auto)** — QGIS trae varios SVG de autos en `:/images/svg/transport/`.
   - `motos` → **motorcycle/moto**.
   - `prohibido` → **sign/no_parking** (o un círculo rojo con barra).
4. Tamaño del marcador ~ **4–6 mm** para que no tape la etiqueta de la línea.
5. Aplicar.

**En la leyenda del layout:** la capa de centros (con sus 3 categorías SVG) es la que se muestra en la leyenda. Se pueden ocultar los símbolos de línea si estorban (clic derecho en la leyenda → editar símbolos) y dejar solo los SVG.

> Alternativa para probar rápido: en Simbología de la **capa de líneas** se puede usar **"Generador de geometría"** con `point_on_surface($geometry)` o `line_interpolate_point($geometry, length($geometry)/2)` y el mismo SVG — pero como capa aparte queda mejor para leyenda y filtros.

---

## Parte 3 — Layout (A3 de trabajo y A1 de presentación)

El proyecto tiene 2 layouts: **"Estac. Medidos Chajarí A3"** (trabajo) y **"Estac. Medidos Chajarí A1"** (presentación — el principal).

1. **Administrador de composiciones** → abrir el layout (A1 para presentar).
2. Reajustar el **item de mapa** para llenar el folio.
3. **Tabla de atributos** (item del layout):
   - Columnas: `fid | calle | entre_calle_1 | entre_calle_2 | lado | tipo | longitud_geom | plazas_auto | plazas_auto_frac`
   - Filtro: `"tipo" = 'autos'` (solo segmentos de autos).
   - Orden: `fid` ascendente (en "Propiedades de la columna" → Ordenamiento).
   - `plazas_auto_frac` con **2 decimales** (Formato numérico → Number → Decimals 2, o `format_number("plazas_auto_frac", 2)`).
4. **Leyenda:** la capa de centros con los SVG da la referencia visual.

> Si A3 alcanza → **listo para la reunión**. Si necesitás detalle por cuadra → Atlas (otro runbook).

---

## Criterios y constantes

- Plaza de auto = **5.5 m**; tramo 4.5–5.5 m cuenta 1 (compacto).
- Motos **no computan** ingreso/capacidad (solo se dibujan).
- Capacidad = `Σ plazas_auto` por tramo (floor por tramo + regla del compacto).
- Capa de centros: punto a **mitad de recorrido** del segmento (no centroide geométrico, que en curvas queda fuera de la línea).