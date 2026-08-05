# Capa Virtual QGIS 4 — Resumen por Cuadra (Estacionamiento Medido)

## Contexto

- **Capa fuente:** `relevamiento_em_P07F6_ALE` (GeoJSON, EPSG:5348 — POSGAR 2007 / Argentina 6)
- **Geometría:** MultiLineString (segmentos sobre cordón de calle)
- **Campos clave:** `fid`, `calle`, `entre_calle_1`, `entre_calle_2`, `lado`, `tipo` ('autos'/'motos'), `largo_m`, etc.
- **Objetivo:** Capa virtual agrupada por cuadra con lista de fids y metros de autos y motos

---

## Diagnóstico — Tres problemas identificados

### Problema 1: `ST_Length(geometry)` devuelve 0

Cuando la fuente es un proveedor **OGR (GeoJSON)**, QGIS expone la geometría como un
blob WKB "crudo". SpatiaLite no lo interpreta directamente con `ST_Length()` — hay que
envolverlo primero con `ST_GeomFromWKB()`:

```sql
-- ❌ Devuelve 0
ST_Length(geometry)

-- ✅ Correcto para fuentes OGR/GeoJSON en QGIS 4
ST_Length(ST_GeomFromWKB(geometry))
```

> **Nota:** Retorna metros porque EPSG:5348 es un CRS proyectado.
> El campo virtual `longitud_geom` funciona porque usa la API interna de QGIS
> (`length($geometry)`), que maneja la conversión automáticamente. Las capas virtuales
> no tienen acceso a esa API — solo a SpatiaLite.

---

### Problema 2: Typo en el `GROUP BY` de la 3ra prueba

```sql
-- ❌ entre_calle_2 repetida dos veces → agrupa mal → resultado con nulls
GROUP BY calle, entre_calle_2, entre_calle_2

-- ✅ Correcto
GROUP BY calle, entre_calle_1, entre_calle_2
```

---

### Problema 3: Sintaxis de `group_concat` en SQLite

En SQLite el separador personalizado va como **segundo argumento** (no con `SEPARATOR`
como en MySQL):

```sql
-- ✅ SQLite — separador como 2do argumento
group_concat(valor, ' | ')
```

`group_concat` ignora los NULL automáticamente, por eso el `CASE WHEN` que devuelve
NULL para el tipo que no corresponde funciona correctamente para filtrar.

---

## SQL Definitivo — Pegar en la Capa Virtual

```sql
SELECT
  calle,
  entre_calle_1 || ' y ' || entre_calle_2                          AS tramo,

  -- AUTOS
  COUNT(CASE WHEN tipo = 'autos' THEN 1 END)                       AS autos_cant,
  round(
    SUM(CASE WHEN tipo = 'autos'
        THEN ST_Length(ST_GeomFromWKB(geometry)) ELSE 0 END)
    / 0.5, 0) * 0.5                                                 AS autos_m_total,
  group_concat(
    CASE WHEN tipo = 'autos'
    THEN CAST(fid AS TEXT) || '=' ||
         CAST(round(ST_Length(ST_GeomFromWKB(geometry))/0.5,0)*0.5 AS TEXT) || 'm'
    END,
    ' | '
  )                                                                  AS autos_detalle,

  -- MOTOS
  COUNT(CASE WHEN tipo = 'motos' THEN 1 END)                       AS motos_cant,
  round(
    SUM(CASE WHEN tipo = 'motos'
        THEN ST_Length(ST_GeomFromWKB(geometry)) ELSE 0 END)
    / 0.5, 0) * 0.5                                                 AS motos_m_total,
  group_concat(
    CASE WHEN tipo = 'motos'
    THEN CAST(fid AS TEXT) || '=' ||
         CAST(round(ST_Length(ST_GeomFromWKB(geometry))/0.5,0)*0.5 AS TEXT) || 'm'
    END,
    ' | '
  )                                                                  AS motos_detalle

FROM "relevamiento_em_P07F6_ALE"
GROUP BY calle, entre_calle_1, entre_calle_2
ORDER BY calle, entre_calle_1
```

### Ejemplo de resultado esperado

| calle   | tramo              | autos_cant | autos_m_total | autos_detalle             | motos_cant | motos_m_total | motos_detalle |
|---------|--------------------|-----------|---------------|---------------------------|-----------|---------------|---------------|
| Urquiza | Sarmiento y Mitre  | 3         | 45.0          | 2=18.5m \| 5=12.0m \| 8=14.5m | 1     | 9.5           | 11=9.5m       |

---

## Respuestas Directas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Nombre de columna de geometría? | Se llama `geometry`, pero envolver en `ST_GeomFromWKB()` |
| ¿`length()` vs `ST_Length()`? | Usar `ST_Length(ST_GeomFromWKB(geometry))` |
| ¿Separador en `group_concat`? | `group_concat(valor, ' \| ')` — el separador es el 2do argumento |
| ¿Dejar geometría fuera del SELECT? | **Sí, obligatorio.** Si se incluye `geometry` con agregación, cada feature queda separado y se rompe el agrupamiento |
| ¿Cómo concatenar fid + largo legible? | `CAST(fid AS TEXT) \|\| '=' \|\| CAST(round(...) AS TEXT) \|\| 'm'` |

---

## Pasos en QGIS

1. **Capa → Crear capa → Nueva capa virtual**
2. En **"Capas empotradas"**: verificar que `relevamiento_em_P07F6_ALE` aparezca
   con el mismo nombre local que se referencia en el SQL
3. Pegar el SQL de arriba en **"Consulta"**
4. Dejar **"Columna de identificador único"** vacía (es tabla sin geometría)
5. Dejar **"Geometría"** en **"Sin geometría"**
6. Clic **Prueba** → si aparece la grilla con datos, clic **Añadir**

---

## Notas Adicionales

- **¿Por qué no usar `largo_m` del campo?** Porque algunos features tienen `largo_m`
  en NULL. El cálculo debe basarse en la geometría real.
- **Alternativa si `ST_GeomFromWKB` no funciona:** usar el alias SpatiaLite legacy
  `GLength(geometry)` — aunque en QGIS 4 con SpatiaLite moderno esto es poco probable.
- **Para usar en Layout de impresión:** agregar la capa virtual al proyecto y luego
  insertarla como "Tabla de atributos" en la composición. Al ser una tabla sin
  geometría, no aparecerá en el mapa pero sí estará disponible para el layout.

---

*Generado: 2026-08-04 | QGIS 4.x / SQLite + SpatiaLite | EPSG:5348*
