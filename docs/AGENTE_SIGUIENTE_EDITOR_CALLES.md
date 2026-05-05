# DOCUMENTACIÓN PARA AGENTE SIGUIENTE - Editor Calles Pavimentadas

> **Fecha:** Abril 2026
> **Rama:** `feature/ui-ide-sidebar`
> **Estado:** En desarrollo - Fase 3 Integración Supabase

---

## RESUMEN DEL TRABAJO REALIZADO

### 1. Editor HTML v2.1 (`docs/editor_calles_pavimentadas_v2.html`)

**Funcionalidades implementadas:**

| Función | Descripción | Estado |
|---------|-------------|--------|
| Carga inicial | Carga 2422 segmentos desde `calles_segmentadas.geojson` | ✅ Funciona |
| Sincronizar estados | Intenta traer estados desde Supabase al cargar | ✅ Funciona |
| Subir a Supabase | Upsert de cambios a tabla `calles_pavimentadas` | ⚠️ Ver pendiente |
| Reemplazar Todo | Borra tabla e inserta 2422 segmentos nuevos | ⚠️ **FALLA - VER ERRORES** |
| Importar segmentos | Carga GeoJSON adicional desde QGIS | ✅ Funciona |

### 2. PavimentoLayer.tsx

**Cambios:**
- Polling cada 30 segundos para sincronización
- Popup mejorado con estado, tipo obra, entre calles
- Estilos diferenciados por estado (conservado/pendiente/descartado)

---

## ERRORES PENDIENTES (URGENTE)

### ERROR CRÍTICO: Reemplazar Todo falla

```
Error: Error en lote 1: Geometry type (LineString) does not match column type (MultiLineString)
```

**Causa:** 
- La tabla `calles_pavimentadas` tiene columna `geom` de tipo `Geometry(MultiLineString, 4326)`
- El editor envía `LineString` directamente desde `seg.geom`
- Hay conversión en código pero parece no estar funcionando

**Ubicación del código:**
- Línea ~1096 en `reemplazarTodoEnSupabase()`
- Línea ~821 en `guardarEnSupabase()`

**Código actual (que debería funcionar pero no):**
```javascript
const records = segments.map(seg => {
  let geom = seg.geom;
  if (typeof geom === 'string') {
    try { geom = JSON.parse(geom); } catch(e) { geom = null; }
  }
  if(geom.type === 'LineString') {
    geom = {
      type: 'MultiLineString',
      coordinates: [geom.coordinates]
    };
  }
  return { ..., geom: geom, ... };
}).filter(r => r !== null);
```

**Posibles causas:**
1. `seg.geom` no tiene la estructura esperada
2. Algunos segmentos ya son MultiLineString y no se detecta
3. El filtro `filter(r => r !== null)` no está funcionando

**Para debuggear:**
```javascript
console.log('Geom type:', geom?.type);
console.log('Seg geom:', JSON.stringify(seg.geom));
```

---

## DATOS IMPORTANTES

### GeoJSON Local
- **Archivo:** `docs/calles_segmentadas.geojson`
- **Segmentos:** 2422
- **Tipo geometría:** LineString
- **Estado inicial:** Todos "pendiente"

### Tabla Supabase
- **Tabla:** `calles_pavimentadas`
- **Segmentos actuales:** 875 (datos viejos/incompletos)
- **Tipo columna geom:** `Geometry(MultiLineString, 4326)`
- **Columnas:** id, fid, nombre, geom, longitud_m, estado, tipo_obra, entre_calle_1, entre_calle_2, fecha_aprobacion_concejo, fecha_inauguracion, observaciones, created_at, updated_at

### Workflow del usuario
1. Carga 2422 segmentos desde archivo local
2. Clasifica segmentos (conservado/descartado/pendiente)
3. Edita atributos (tipo obra, entre calles, fechas)
4. **PENDIENTE:** Subir todo a Supabase reemplazando los 875 viejos
5. El mapa React mostrará los cambios con polling

---

## TAREAS PENDIENTES

### 1. URGENTE: Fix error geometría MultiLineString
- [ ] Debuggear por qué `LineString` llega a Supabase
- [ ] Verificar que la conversión se ejecuta para TODOS los segmentos
- [ ] Agregar validación antes de subir
- [ ] Probar "Reemplazar Todo" hasta que funcione

### 2. Después de fixear geometría
- [ ] Ejecutar "Reemplazar Todo" para subir 2422 segmentos
- [ ] Verificar en Supabase que se cargaron correctamente
- [ ] Verificar en mapa React que se ven los segmentos

### 3. Mejoras opcionales
- [ ] Agregar barra de progreso durante carga
- [ ] Mejorar manejo de errores de RLS
- [ ] Agregar opción para descargar GeoJSON con solo "conservados"

---

## COMANDOS GIT

```bash
# En oficina, antes de empezar
git pull origin feature/ui-ide-sidebar

# Después de hacer cambios
git add docs/editor_calles_pavimentadas_v2.html
git commit -m "fix: [descripcion del fix]"
git push origin feature/ui-ide-sidebar
```

---

## ESTRUCTURA DEL PROYECTO

```
docs/
├── editor_calles_pavimentadas_v2.html  # Editor HTML/JS
├── calles_segmentadas.geojson          # Fuente de verdad (2422 segmentos)
├── MODULO_CALLES_PAVIMENTADAS.md       # Documentación general
└── IMPLEMENTACION_SUPABASE_EDITOR.md   # Documentación técnica

src/components/
└── PavimentoLayer.tsx                  # Capa React (ya actualizado)
```

---

## NOTAS PARA AGENTE SIGUIENTE

1. **El archivo `calles_segmentadas.geojson` debe estar en la misma carpeta que el HTML** para que la carga inicial funcione.

2. **Las credenciales de Supabase están embebidas en el HTML** - no necesitan configuración adicional.

3. **El error de geometría es el único bloqueante** - todo lo demás funciona.

4. **Para probar:**
   - Abrir `docs/editor_calles_pavimentadas_v2.html` en servidor local
   - Verificar que carga 2422 segmentos
   - Marcar algunos como "conservado"
   - Probar botón "Reemplazar Todo"
   - Ver consola para errores

5. **Si no se puede fixear rápido:** Considerar crear función SQL en Supabase que convierta automáticamente, o cambiar la columna a tipo genérico `Geometry`.

---

## CONTACTO/CONTEXTO

- **Usuario:** Andrés Saposnik
- **Municipalidad:** Chajarí, Entre Ríos
- **Proyecto:** Sistema de control de relevamientos municipales
- **Contexto:** Los 875 segmentos en Supabase son obsoletos. Los 2422 del GeoJSON son la versión actualizada y segmentada correctamente.

**Objetivo final:** Tener los 2422 segmentos en Supabase, clasificados en ~30% conservados (calles pavimentadas reales) y ~70% descartados.
