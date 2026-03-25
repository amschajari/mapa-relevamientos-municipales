# HOJA DE RUTA Y CONTEXTO DE DESARROLLO - 18/03/2026
## Sistema de Control de Relevamientos - Municipalidad de Chajarí

Este documento sirve como guía para el desarrollo continuo y transferencia de contexto entre agentes de IA y desarrolladores.

---

## 1. Resumen de Implementación Actual (Checkpoint 25/03/2026)
- **Importador Odoo (V2)**: Estrategia de etiquetas validada operativamente. Bulk upsert con deduplicación.
- **Mapa Responsive (Mobile)**: Menú hamburguesa, marcador GPS, panel de info y layout responsive.
- **Clusters (Celeste/Cyan)**: Zoom automático al click, cobertura visual y paleta diferenciada.
- **Seguridad (Hardening)**: `search_path` fijo en funciones SQL. RLS endurecido (lectura pública / escritura admin).
- **Estándares**: `AGENT_WORKFLOW.md`, `DEVELOPMENT.md`, `ROADMAP.md` establecidos.
- **Agentic Workflows**: Directorio `.agent/workflows` configurado.
- **Persistencia**: Sincronización total con Supabase (puntos, barrios, jornadas).
- **Selector de Mapas Base**: Alternancia entre OSM y Satelital (ESRI) con persistencia local.
- **Seguridad Auth**: LoginModal mejorado. Usuario Master: `a.m.saposnik@gmail.com`.

---

### 🗺️ El GIS como "Borrador Estratégico" (Acompañamiento a Odoo)
- **Problema**: El registro oficial se realiza en **Odoo**. El GIS no debe competir ni duplicar esa carga.
- **Nueva Visión**: El GIS es el panel de **Hoja de Ruta/Proyección**. Sirve para que el coordinador visualice y planifique las salidas de campo que luego se registran en Odoo.
- **Métrica Clave**: No buscamos el % final de Odoo, buscamos la **Cobertura Geográfica**. Asegurar que los equipos pasen por todas las calles.
- **Acción Inmediata**:
    - Reemplazar "Progreso %" por **"Manzanas Recorridas"** o **"Estado de Avance"**.
    - Crear vistas de **Reporte para Autoridades**: Mapas de "semáforo" para el Intendente que muestren avance real vs. proyectado de forma intuitiva.

### 📍 Piloto San Clemente (Contexto de Reflexión)
- **Objetivo**: Probar la utilidad del GIS como guía de campo. El usuario usará su experiencia previa para validar si el mapa ayuda a coordinar mejor los recorridos.
- **Relación con Odoo**: Odoo manda en el dato. El GIS manda en la **estrategia espacial**.

---

### 🗺️ Documentación Estratégica
### 🎯 Hito actual: Importador V2 - Estrategia de Etiquetas (Label Over Geometry)
- **Simplificación Estratégica**: Se prioriza la etiqueta `Barrio` de Odoo sobre el cálculo espacial para evitar errores de precisión iniciales.
- **Matching Inteligente**: El sistema asocia puntos a polígonos mediante coincidencia de nombres normalizados (ignorando tildes y mayúsculas).
- **Gestión Independiente**: El GIS muestra la realidad del terreno, mientras que el coordinador gestiona manualmente el estado del barrio (En progreso, Completo).
- **Enriquecimiento**: Soporte para campos de `Tipo de Cableado` 🔌 y `Medidor` ⏲️.

### 🛤️ Próximos Pasos Técnicos
1. **Consolidación de Datos**: Importar masivamente los relevamientos históricos (San Clemente y otros).
2. **Tablero de Control**: Mejorar los KPIs del dashboard basados en la carga manual de jornadas.
3. **Auditoría Espacial (Fase 2)**: Reintroducir Turf.js solo como herramienta de auditoría (para detectar puntos que "físicamente" están en otro barrio) sin que bloquee la importación administrativa.
3. **Control de Capas V2**: Visualización de semáforo (Verde: Relevado, Rojo: Pendiente) basado en polígonos.
4. **Control de Capas**: Asegurar que podamos "tachar" o pintar calles recorridas manualmente desde el Dashboard.
5. **Integración Odoo**: Investigar endpoint de "Atención al Vecino" para visualizar tickets sobre el mapa.
6. **Asignación Espacial (Outliers)**: Implementar Trigger en DB para asignar `barrio_id` vía `ST_Intersects` si el dato es nulo.
7. **Reportes en PDF**: Generación automática de resúmenes de relevamiento por barrio.

---

## 3. Seguridad y Roles (Master Admin)
- **Usuario Master**: `a.m.saposnik@gmail.com`
- **Permisos**: Solo este usuario (o usuarios validados) pueden ver los iconos de edición (lápiz) y botones de "Guardar".
- **Estado**: **Implementado** (Supabase Auth integrado con el store. LoginModal funcional).

### 🧹 Limpieza de Datos (Completada)
- **Acción**: Eliminados registros de `luminarias_estimadas` y `progreso` ficticios.
- **Estado**: **Finalizado**. El sistema inicia en 0 para ser llenado con datos estratégicos reales.

---

## 4. Hitos Logrados (Sesión 19/03)
1. **Desacoplamiento de Carga**: Mover la interfaz de "Cargar puntos" fuera del modal de barrios a una sección independiente (Configuración/Global). **Estado: Finalizado**.
2. **Motor de Importación (Bulk Upsert)**: Reemplazada carga secuencial por carga masiva. **Estado: Finalizado**.
3. **Deduplicación de Datos**: Implementada lógica de `upsert` basada en "ID Luminaria". **Estado: Finalizado**.
4. **Resiliencia de Carga**: Escudo contra barrios mal escritos (ej: "Sam Clemente") para evitar bloqueos del lote. **Estado: Finalizado**.
5. **Limpieza de UI**: Remoción de botones obsoletos y reubicación de "Reiniciar Barrio" a la zona de peligro. **Estado: Finalizado**.
6. **Validación de Build**: Proyecto 100% verificado con `npm run build`. **Estado: Finalizado**.

## 5. Próximos Pasos (Pendientes)
1. **Auditoría Espacial (Fase 2)**: Reintroducir Turf.js solo como herramienta de auditoría (para detectar puntos que "físicamente" están en otro barrio) sin que bloquee la importación administrativa.
2. **Dashboard de Reportes**: Crear vistas de "semáforo" para el Intendente.
3. **Exportación PDF**: Generar resúmenes por barrio.

## 5. Reflexiones de Negocio y GIS
### Pregunta: ¿Qué pasa con los puntos fuera de los polígonos barriales?
**Respuesta:** Actualmente, el sistema lo resuelve importándolos con `barrio_id = null`.
- **Visibilidad:** Son visibles en el mapa global pero no "cuentan" para las estadísticas de ningún barrio del Dashboard.
- **Estrategia Futura:** El GIS debe actuar como "filtro de calidad". Si un punto de Odoo cae fuera, debe marcarse para revisión de los polígonos (¿El barrio es más grande de lo que dibujamos?) o asignarse a un nuevo polígono de "Zona de Expansión".

---

**Nota para futuros agentes**:
El proyecto usa una estructura de carpetas limpia en `/src`. Los estilos son Tailwind neutros/profesionales. La lógica de negocio pesada debe residir en `barrioStore.ts`. Siempre verificar que `useMap` se use dentro de componentes hijos de `MapContainer`.
