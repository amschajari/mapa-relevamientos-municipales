# Estado de Relevamiento EM — Continuación entre ambientes

**Última actualización:** 11/08/2026
**Ambiente origen:** casa (QGIS 4.2.0 — Belém do Pará)
**Rama:** `feature/filtros-pavimento`

> ✅ **Relevamiento COMPLETO y presentado.** El anteproyecto se presentó en **layout A1** el 11/08 con buena recepción del jefe. La capa/migración en la app queda **en pausa** (ver `README.md` §5). Total validado: **204 plazas de autos** (ver tabla en `README.md` §4).

---

## Estado actual del relevamiento

Capa: `relevamiento_em_P07F6_ALE.geojson` — **76 features** sobre **Urquiza + Sarmiento**.

| Cuadra (entre calles) | Total | Autos | Motos | Prohibido |
|---|---|---|---|---|
| Urquiza \| Av 9 de Julio \| Pablo Stampa | 10 | 5 | 2 | 3 |
| Urquiza \| Pablo Stampa \| Rivadavia | 6 | 3 | 2 | 1 |
| Urquiza \| Rivadavia \| 3 de Febrero | 10 | 5 | 2 | 3 |
| Urquiza \| 3 de Febrero \| Entre Ríos | 6 | 3 | 2 | 1 |
| Urquiza \| Entre Ríos \| Alberdi | 8 | 4 | 2 | 2 |
| Urquiza \| Alberdi \| Sáenz Peña | 5 | 3 | 1 | 1 |
| Urquiza \| Sáenz Peña \| Av H Yrigoyen | 6 | 3 | 1 | 2 |
| Urquiza \| Av H Yrigoyen \| Sarmiento | 2 | 1 | 1 | 0 |
| Sarmiento \| Entre Ríos \| Jaime Tabeni | 3 | 2 | 0 | 1 |
| Sarmiento \| Jaime Tabeni \| Av Belgrano | 8 | 4 | 0 | 4 |
| Sarmiento \| Av Belgrano \| Bolivar | 1 | 1 | 0 | 0 |
| Sarmiento \| Bolivar \| San Martín | 6 | 3 | 1 | 2 |
| Sarmiento \| Av H Yrigoyen \| Urquiza | 5 | 3 | 0 | 2 |
| **TOTAL** | **76** | **40** | **14** | **22** |

- Coordenadas en EPSG:5348 (POSGAR 2007 / Argentina 6). Correcto.
- Largos de autos (medidos 10/08): min 5.2 m, max 76.2 m, Σ 1216.9 m → plazas_frac ≈ 221.3.

### Normalización de nombres (hecha 06/08)

Nombres unificados en **ambas capas** (relevamiento y ejes), mismos strings para casamiento directo en la app:

| Regla | Resultado |
|---|---|
| `Avenida` → `Av` | `Av 9 de Julio`, `Av Belgrano` |
| `Avenida Hipólito Yrigoyen` | `Av H Yrigoyen` |
| `Juan Bautista Alberdi` | `Alberdi` |
| `Roque Sáenz Peña` | `Sáenz Peña` |
| `Jaime Tabeni` | se mantiene `Jaime Tabeni` |
| `Entre Ríos`, `San Martín`, `Bolivar` | se mantienen |

76 features, 13 cuadras, nombres de relevamiento ⊆ nombres de ejes.

## Área / trazado del sistema (definido 06/08)

- **Urquiza:** desde **Av. 9 de Julio** hasta el **empalme con Sarmiento**.
- La arteria continúa **+66.7 m** después de **Av. Hipólito Yrigoyen** (tramo fid 16 del eje) y hace una **curva cerrada**, donde cambia de nombre y **sigue como Sarmiento** hasta **Entre Ríos**.
- Implicación: la capa de relevamiento deberá cubrir, en la zona de la curva, la continuación como **Sarmiento** hasta **Entre Ríos**.
- Los ejes del geojson `urquiza_sarmiento_entrecalles.geojson` se mantienen **sin cambios** por ahora.

## Decisiones de modelo de negocio

- **Motos: NO se toman en cuenta para el cálculo de capacidad** aunque SÍ se dibujan en el mapa (su espacio queda registrado). Foco solo en **autos**.
- **Tarifas (referencia anteproyecto):** Vehículos **$400/hs**, Motovehículos **$300/hs**. (El anteproyecto no coincide con la versión del sistema actual; las motos en la fuente oficial figuran con tarifa, pero decidimos NO computar motos en capacidad por ahora.)
- **Promedio auto: 5.5 m** por lugar (configurable). Capacidad de autos = `floor(longitud / 5.5)`.
- **Rampas domicilarias:** ~3 m (obstáculo puntual, feature `tipo='prohibido'` con `motivo='subida_privada'` si se desea descontar del largo útil).
- Área oficial (Ordenanza HCD 1039): Urquiza ambas manos Av 9 de Julio–Sarmiento, más Sarmiento (Entre Ríos–San Martín). El relevamiento cubre más superficie que el área oficial (hasta Alberdi) — dejar el mapa con cobertura total y acotar en la app si corresponde.

## Campos calculados para el layout (YA inyectados en el proyecto el 10/08)

> **Runbook paso a paso:** `RUNBOOK_campos_virtuales_layoutA3.md` (creado 10/08). Define los campos virtuales, la capa de centros SVG, los estilos del mapa y los layouts A3/A1.
> Los 3 campos (`longitud_geom`, `plazas_auto`, `plazas_auto_frac`) ya están **inyectados en el `.qgs`** (en ambas instancias de la capa) — al abrir QGIS se calculan solos. La capa `.geojson` quedó limpia **sin** campos guardados (correcto: son virtuales, viven en el proyecto).

El `GROUP BY` de capas virtuales **falla en QGIS 4** (bug con proveedor OGR/GPKG). Solución: usar **campos virtuales de feature** (motor de expresiones de QGIS, no SpatiaLite).

### Campos de ocupación vehicular (definidos 06/08)

Solo tienen sentido en segmentos `tipo='autos'`; en motos/prohibido quedan `NULL`.

**`plazas_auto`** (entero — plazas reales que caben en el tramo, revisado 10/08 — cuenta tramos compactos 4.5–5.5 m como 1 plaza):
```
if("tipo" = 'autos',
  floor("longitud_geom" / 5.5)
  + if("longitud_geom" >= 4.5 AND "longitud_geom" < 5.5 AND floor("longitud_geom" / 5.5) = 0, 1, 0),
  NULL)
```
> Total sector: **201 plazas** (con floor estricto eran 200; el tramo de 5.2 m ahora cuenta 1). ⚠️ Pendiente de validar con el jefe.

**`plazas_auto_frac`** (decimal — valor sin redondear, referencia interna):
```
if("tipo" = 'autos', "longitud_geom" / 5.5, NULL)
```

**`cap_autos_cuadra`** (capacidad de autos por cuadra/lado, se repite en cada fila de la cuadra):
```
aggregate(
  'relevamiento_em_P07F6_ALE',
  'sum',
  if("Tipo" = 'autos', floor("longitud_geom" / 5.50), 0),
  "entre_calle_1" = attribute($currentfeature,'entre_calle_1')
  AND "entre_calle_2" = attribute($currentfeature,'entre_calle_2')
  AND "lado" = attribute($currentfeature,'lado')
)
```
> Nota: cambiar `5.50` por `5.00` si el proyecto oficial usa otro valor de referencia por auto.

**Tabla del layout (presentación):**
- Proyecto con 2 layouts: **"Estac. Medidos Chajarí A3"** (trabajo) y **"Estac. Medidos Chajarí A1"** (presentación, el principal).
- Columnas actuales: `fid | calle | entre_calle_1 | entre_calle_2 | lado | tipo | longitud_geom`
- Para la presentación (A1): filtro de tabla `"tipo" = 'autos'`, orden por `fid` ascendente, columnas `plazas_auto` y `plazas_auto_frac`, y `plazas_auto_frac` con 2 decimales (`format_number` o formato numérico).

## Problemas conocidos / notas

- La capa virtual con `GROUP BY` devuelve 0 en QGIS 4; workaround = `aggregate()` por feature o tabla directa sobre la capa en el layout.
- `ST_Length(geometry)` no funciona sobre proveedor OGR; el campo virtual `length($geometry)` sí funciona (depende de la API interna de QGIS).
- El `.gpkg` derivado se ignora (`.gitignore`), no se commitea.

## Archivos de trabajo

| Archivo | Rol |
|---|---|
| `relevamiento_em_P07F6_ALE.geojson` | Capa de relevamiento activa (40 features). |
| `relevamiento_em_centros.geojson` | Capa de puntos en centros de segmentos (76 pts, EPSG:5348, para símbolos SVG y leyenda). |
| `relevamiento_em_P07F6_ALE.qml` / `.qmd` | Estilos, etiquetas y metadata QGIS. |
| `estacionamiento_medido.qgs` / `.qgs~` / `_attachments.zip` | Proyecto QGIS 4.2 (editable en ambos ambientes). |
| `urquiza_sarmiento_entrecalles.geojson` | Ejes de ambas calles (sin modificar por ahora). |
| `urquiza_sarmiento_centro.geojson` | Capa base limpia. |
| `Anteproyecto_Nuevo_Sistema_Estacionamiento_Medido.md` | Documento oficial recibido. |
| `capa_virtual_qgis4_resumen_cuadra.md` | Estudio de la capa virtual y diagnóstico. |
| `RUNBOOK_campos_virtuales_layoutA3.md` | Pasos de campos virtuales + simbología + layout A3. |
| `README.md` | Documento de trabajo EM. |
| `estacionamiento_medido.gpkg` | No versionado (ignorado). |