# Estacionamiento Medido — Chajarí

> Documento de trabajo para la capa de **Estacionamiento Medido (EM)** del sistema de gestión municipal.
> Última actualización: 2026-07-31

---

## 1. Objetivo / Idea Inicial

Implementar la digitalización del **estacionamiento medido** en Chajarí como una nueva capa del mapa municipal, junto a las capas ya existentes (Luminarias, Espacios Verdes, Calles Pavimentadas, Barrios).

**Estado actual del servicio:**
- El EM funciona actualmente **solo en las calles Sarmiento y Urquiza** (microcentro).
- El control lo realiza una **cooperativa** que terceriza la tarea de los controladores.

**Principio rector:** el proyecto **NO busca prescindir del factor humano**. Las personas que controlan el EM seguirán haciendo su trabajo. La idea es implementar un **sistema híbrido** donde la digitalización favorezca el control municipal sin reemplazar a las personas.

**Qué se está haciendo:**
- Se releva y documenta la experiencia de otras ciudades vecinas con sistemas EM ya implementados.
- Se prepara la capa geográfica en QGIS (Urquiza y Sarmiento).
- Se planifica un relevamiento a campo de los estacionamientos en ambas calles.

---

## 2. Referencias de Otras Ciudades

### Concepción del Uruguay, Entre Ríos — Movilparkking

Sistema de referencia principal consultado. Fuente: https://cdeluruguay.movilparking.com/web/

**Modalidad "Estacionamiento Inteligente" (sistema principal):**
- Registro único en un comercio adherido: se asocian todas las patentes al sistema y se carga crédito. Piden el celular para enviar comprobantes y alertas por SMS.
- El usuario estaciona y no hace nada más: los controladores municipales recorren la zona y debitan del crédito el tiempo real estacionado (se cobra por tiempo real medido, no ticket fijo).
- Cuando se agota el crédito, avisan por SMS gratis. El usuario queda con un "descubierto" equivalente a 6 horas para seguir usando el sistema hasta recargar.

**Alternativa sin registro:**
- "Tiempo Puntual": carga a la patente en cualquier comercio adherido, sin registrarse.

**Costo y horarios:**
- Valor de la hora: **$400**.
- Primavera/Verano: lun a vie de 7 a 12 h y 16 a 21 h.
- Otoño/Invierno: lun a vie de 7 a 12 h y 15 a 20 h.
- Sábados: de 8 a 13 h.

**Zona tarifada:**
- El microcentro surge de un estudio de tránsito para fomentar la rotación vehicular.
- La web tiene una sección "Zona de Estacionamiento y Comercios adheridos" con el mapa, pero es una imagen/mapa embebido (no extraíble como texto).

**Otros detalles útiles:**
- Existe la figura del **"Frentista"**: quienes viven dentro de la zona inician un trámite especial en la municipalidad.
- Próximamente habilitarán carga de crédito con tarjeta de crédito/débito.
- App **"Home Parking"** (Android/iOS) y portal web para consultar saldo, dar de alta/baja vehículos y transferir saldo.

**Otras ciudades ER que usan el mismo sistema Movilparkking:** Victoria, Gualeguay, Nogoyá y La Paz.

> **Pendiente:** revisar cómo modelan la zona tarifada en esas ciudades para comparar.

---

## 3. Capa Actual en QGIS

### Archivos (carpeta `docs/estacionamiento_medido/`)

| Archivo | Descripción |
|---|---|
| `urquiza_sarmiento_centro.geojson` | **La capa de datos** — 6 features LineString, CRS EPSG:4326 |
| `estacionamiento_medido.qgs` | Proyecto QGIS v4.2 con la capa cargada |
| `estacionamiento_medido.qgs~` | Backup del proyecto |
| `estacionamiento_medido_attachments.zip` | Anexos del proyecto QGIS (estilos) |
| `OFnLtF_styles.db` | Base de estilos |

### Estructura de la capa

- **Geometría:** LineString (tramos de calle)
- **CRS:** EPSG:4326 (proyecto en EPSG:3857)
- **Campos actuales:**
  - `id` — identificador de OSM (`way/XXXX`)
  - `name` — nombre de calle: `Sarmiento` | `Urquiza`
- **Estilo en QGIS:** render **categorizado por campo `name`** (Sarmiento y Urquiza con colores distintos).
- **QFieldSync:** configurado (tracking y fotos por feature) — pensado para relevamiento en terreno con QField.

### ⚠️ Observaciones técnicas

1. ~~El feature de Urquiza (`way/201783981`) tiene coordenadas repetidas/duplicadas al inicio~~ — **Resuelto 2026-07-31**: se limpiaron los duplicados de Urquiza y el spike de `way/544430199`. La capa quedó sin coordenadas repetidas.
2. Los `id` provienen de OSM, no son FIDs propios. Para la app municipal se necesita un **`fid` propio** (numérico único).
3. Se deberá normalizar la geometría a **MultiLineString** (como en Calles Pavimentadas) para consistencia con Supabase.

---

## 4. Relevamiento a Campo (pendiente)

> Planificado para el **lunes**. Salir a relevar los estacionamientos en Urquiza y Sarmiento.

Campos preliminares a capturar por tramo/cuadra:

- `calle` — nombre de calle
- `altura` o `entre_calles` — ubicación del tramo (desde/hasta)
- `lado_vereda` — vereda par/impar
- `capacidad` — cantidad estimada de espacios
- `tipo_zona` — general / frentista
- `horario` — franja horaria (si varía por tramo)
- `tarifa` — valor por hora
- `senializacion` — estado de cartelería / demarcación
- `observaciones` — notas del relevamiento

> La lista definitiva se ajusta después del relevamiento.

---

## 5. Plan de Implementación en la App

Estructura prevista siguiendo el patrón de las capas existentes:

1. **Migración SQL** (`supabase/migrations/20260730_add_estacionamiento_medido.sql`)
   - Tabla `estacionamiento_medido`: `id`, `fid UNIQUE`, `nombre`, `calle`, `tipo`, `horario`, `tarifa`, `capacidad`, `geom (MultiPolygon o MultiLineString)`, `observaciones`, `created_at`, `updated_at`.
   - **GRANTs explícitos** para `anon`, `authenticated`, `service_role` (obligatorio post-Oct 2026).
   - RLS: lectura pública, escritura para authenticated.
   - Índices espaciales y por nombre/tipo.
   - Función de upsert con geometría.

2. **Store** (`src/stores/mapStore.ts`)
   - Nuevo estado `estacionamientoMedido` + acción `fetchEstacionamientoMedido()`.
   - Dominio `estacionamiento` en `DEFAULT_DOMAINS` (icono `ParkingCircle`, capa `estacionamiento-todas`).
   - Capa **apagada por defecto** y solo activable por usuarios logueados (admin).

3. **Componente de capa** (`src/components/EstacionamientoMedidoLayer.tsx`)
   - Patrón imperativo (como EspaciosVerdesLayer).
   - Estilo por tipo de zona con tooltip (nombre, calle, horario, tarifa).

4. **Importador** (`src/components/ImportadorEstacionamientoMedido.tsx`)
   - Drag & drop de GeoJSON, preview con validación, modo merge/upsert por FID, batch de 100.

5. **UI**
   - `LayersPanel`: ícono e integración (gated por login).
   - `ControlMap`: render de la capa.
   - `ImportacionView`: nuevo tab "Estacionamiento Medido".

---

## 6. Próximos Pasos / Decisiones Abiertas

- [ ] Realizar relevamiento a campo en Urquiza y Sarmiento (lunes).
- [ ] Definir lista definitiva de campos de la capa.
- [ ] Definir el tipo de geometría definitivo (segmentos de línea vs. polígonos de zona).
- [ ] Revisar experiencias de otras ciudades (Victoria, Gualeguay, Nogoyá, La Paz).
- [ ] Definir alcance del componente digital (solo visualización municipal vs. operativo para controladores).
- [ ] Limpiar y normalizar la capa QGIS (FID propio, geometría, duplicados de Urquiza).
- [ ] Ejecutar migración Supabase y subir la capa a la app.
