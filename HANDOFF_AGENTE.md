# HANDOFF: Importador Dinámico de Polígonos de Barrios
## Para el agente de mañana — rama `edicion-poligonos-barrios`

---

## Estado actual del proyecto (al 01/04/2026)

### ✅ Código implementado y compilando
Todo el código nuevo está en la rama `edicion-poligonos-barrios`. El build pasa sin errores.

### ✅ Qué se implementó
1. **`ImportadorPoligonos.tsx`** (nuevo): Componente drag & drop para importar GeoJSON de polígonos de barrios desde QGIS. Valida geometrías, calcula hectáreas con Turf.js, muestra preview con acciones (NUEVO / ACTUALIZAR / ELIMINAR) antes de confirmar.
2. **`ImportacionView.tsx`** (nuevo): Wrapper con dos pestañas: "Luminarias (Puntos)" y "Barrios (Polígonos)". Reemplaza al `ImportadorDatos` como punto de entrada en el menú.
3. **`barrioStore.ts`** (modificado): Nueva función `importarPoligonosBarrios()` que hace upsert por nombre + elimina barrios huérfanos. `fetchBarrios` ahora lee la columna `geojson` desde Supabase.
4. **`ControlMap.tsx`** (modificado): El mapa ya no depende de `barrios-chajari.json` estático. Construye el GeoJSON dinámicamente desde el estado del store (`barrios[].geojson`).
5. **`App.tsx`** (modificado): Usa `ImportacionView` en lugar de `ImportadorDatos`. Ya no importa el JSON estático.

---

## ❌ Bug encontrado que HAY QUE CORREGIR mañana

### El problema
El usuario arrastró un GeoJSON de polígonos y aterrizó en la pestaña **"Importar Luminarias"** en lugar de **"Barrios (Polígonos)"**.

Esto pasa porque la vista de "Importar Datos" en el menú lateral carga `ImportacionView`, pero la **pestaña activa por defecto es "Luminarias"**. El usuario no notó que había que cambiar de pestaña.

### Screenshot del error
El importador de luminarias interpretó el GeoJSON de San Clemente como un punto sin coordenadas válidas → "0 válidos, 1 con errores".

### Solución propuesta
**Opción A (recomendada)**: Detectar automáticamente el tipo de archivo. Si el GeoJSON contiene `Polygon/MultiPolygon` → auto-switchear a la pestaña de Barrios y mostrar un aviso: *"Detectamos un archivo de polígonos. Cambiamos a la pestaña correcta."*

**Opción B**: Cambiar el label de la zona de drop del importador de luminarias para que diga explícitamente: *"Solo se aceptan archivos con puntos (Point). Para polígonos de barrios, usá la pestaña Barrios."*

---

## Flujo de prueba pendiente (hacer mañana)

### Contexto importante
- **El mapa actualmente no muestra polígonos** porque Supabase aún no tiene geometrías (`geojson` column vacía para cada barrio). Esto es esperado y correcto — es exactamente lo que el importador va a solucionar.
- **Los puntos/luminarias están a salvo**. Están en la tabla `puntos_relevamiento`, relacionados por `barrio_id` (UUID). Cambiar/importar polígonos NO los afecta.
- **San Clemente tiene todos sus puntos relevados** — es el primer barrio terminado. Su `barrio_id` en Supabase debe mantenerse intacto.

### Archivo de prueba en escritorio
```
C:\Users\ALE\Desktop\test_poligonos_barrios\
├── TEST_1_todos_sc_editado.geojson  ← 44 barrios (todos menos Villa Anita), San Clemente levemente editado
└── TEST_2_agregar_centro.geojson    ← Solo Centro (para probar agregar uno solo)
```

### Pero en la oficina el usuario tiene su propio .geojson de QGIS editado
Usar directamente ese archivo es mejor que los de prueba.

### Pasos para probar en la oficina
1. Levantar el servidor: `npm run dev` (en rama `edicion-poligonos-barrios`)
2. Ir a **Importar Datos** → pestaña **Barrios (Polígonos)** ← **¡OJO: pestaña correcta!**
3. Arrastrar el `.geojson` exportado de QGIS
4. Revisar el preview (NUEVO / ACTUALIZAR / ELIMINAR) antes de confirmar
5. Confirmar → el mapa debería mostrar los nuevos polígonos al instante

### Verificación post-import
- El mapa debe mostrar los contornos de los barrios (ya no desde el JSON estático)
- Los puntos de San Clemente deben seguir apareciendo sobre el polígono correcto
- Villa Anita no debería estar más en la lista (Supabase la eliminará si no tiene puntos)

---

## Archivos clave modificados
- `src/components/ImportadorPoligonos.tsx` (NUEVO)
- `src/components/ImportacionView.tsx` (NUEVO)
- `src/components/ControlMap.tsx` (mapa dinámico)
- `src/stores/barrioStore.ts` (importarPoligonosBarrios, fetchBarrios lee geojson)
- `src/App.tsx` (usa ImportacionView, sin JSON estático)

## Backup original
- `src/data/barrios-chajari.json` → **45 barrios originales, intacto, no modificado**. Sirve como fallback para restaurar si algo falla.
