# HOJA DE RUTA - 12/03/2026
## Sistema de Control de Relevamientos - Municipalidad de Chajarí

Este documento establece el estado actual del proyecto, los desafíos identificados y el plan de acción para las próximas etapas de desarrollo.

---

## 1. Estado de Avance Actual
- **Mapa Interactivo**: Capa de polígonos (Barrios) estable y optimizada.
- **Inventario Persistente**: Implementada tabla `puntos_relevamiento` en Supabase (PostGIS).
- **Control de Capas**: UI flotante para prender/apagar Barrios y Luminarias.
- **Visualización Pro**: Clusterización de luminarias con diseño "Luz" (Amarillo Ámbar con pulso).
- **Gestión Admin**: Botón de **Reiniciar Relevamiento** para limpieza de datos de prueba.
- **Seguridad RLS**: Políticas configuradas para CRUD de puntos vía JWT (Master Admin).
- **Sincronización Inteligente**: Auditor de superficie (Ha) y estimación automática de luminarias.
- **Corrección de Bugs**: Resuelto "Error #300" (crash de Leaflet al ocultar capas).

---

## 2. Inquietudes y Desafíos Planteados

### 👥 Módulo de Equipos (Refinamiento)
- **Realidad**: Actualmente 2 personas en horario vespertino (posibilidad de 3-4).
- **Estrategia**: El módulo debe ser flexible para agregar empleados sin restricciones de rol rígidas inicialmente.
- **Acción**: Simplificar el registro de "Equipos" a nombres de operarios y permitir asignaciones múltiples a un mismo barrio.

### 📊 Base de Datos y Progreso
- **Realidad**: Los totales actuales (2.955) son ficticios. No hay una "base inicial" exacta.
- **Estrategia**: 
    - Cambiar la métrica de **"% de Progreso Fijo"** a **"Densidad de Relevamiento"**.
    - Permitir que el Coordinador fije una "Estimación Sugerida" que se ajusta a medida que el relevamiento avanza.
    - Mostrar progreso por **"Manzanas completadas"** o **"Calles recorridas"** si es posible, en lugar de un número total desconocido a priori.

### 🗺️ Gestión de Barrios/Geometría
- **Realidad**: Los polígonos vienen de QGIS. Se necesita alta precisión y posibilidad de añadir nuevos barrios.
- **Estrategia**:
    - Mantener el flujo de **Importación GeoJSON** para cambios estructurales grandes (traer de QGIS).
    - Implementar herramienta de **Dibujo/Edición simple** en el mapa para ajustes menores (vértices).
    - Botón **"+ Nuevo Barrio"** que permita subir un archivo .geojson específico para ese barrio o dibujar su área.

### 🔑 Autenticación y Usuarios
- **Admin**: Acceso completo para `a.m.saposnik@gmail.com`.
- **Lectura**: Generar roles de "Visualizador" (Jefes/Interesados) que no puedan editar datos pero sí ver el mapa y estadísticas.

---

## 3. Plan de Acción Inmediato (Sprint Actual)

### Tarea 1: Refuerzo de Identidad y Roles
- Configurar el usuario `a.m.saposnik@gmail.com` como Master Admin en Supabase.
- Implementar pantalla de Login simple (Supabase Auth).

### Tarea 2: Flexibilidad en Relevamiento
- Cambiar el campo `luminarias_estimadas` a opcional o "estimado ajustable".
- Agregar visualización de "Última actividad" por barrio (quién relevó y cuándo).

### Tarea 3: DevOps y Deploy
- **Git**: Push a `main`.
- **GitHub Pages**: Reactivar la rama `gh-pages`.
- **CI/CD**: Verificar `deploy.yml` para asegurar que el build de Vite usa el `base` path correcto (`/mapa-relevamientos-municipales/`).

---

## 4. Visión de Integración (Fase 2+)
- **Odoo Municipal**: 
    - Vinculación con reclamos de "Atención al Vecino".
    - Sincronización de inventario de luminarias (compras/garantías).
- **Testing y Calidad**: 
    - Implementar tests unitarios para la lógica del `barrioStore`.
    - Code review enfocado en escalabilidad de capas de GeoJSON.

---
 
 ## 5. Dinámica de Trabajo Diario (Puente Odoo-GIS)
 
 Para resolver la desconexión actual entre el relevamiento en Odoo y el control en el GIS, se establece la siguiente dinámica:
 
 ### A. Fase de Transición (Actual - Manual)
 - **Registro en Odoo**: Los chicos cargan los datos en Odoo como fuente oficial.
 - **Sincronización al GIS**: Al final de la jornada (o semanalmente), se exporta un listado de Odoo y se usa la herramienta **"Libro de Guardia"** en el GIS para registrar la cantidad total de luminarias cargadas por barrio.
 - **Auditoría Visual**: Si se dispone del archivo de puntos (KML/GeoJSON) que generan los chicos, se usa la **"Capa de Descubrimiento"** para ver *geográficamente* dónde estuvieron y oficializar esos puntos si coinciden con los totales de Odoo.
 
 ### B. Fase de Integración (Futuro - Automatizado)
 - **Importador de Odoo**: Desarrollar un script que lea la API de Odoo diariamente.
 - **Matching Geográfico**: El GIS buscará automáticamente nuevos registros en Odoo y los proyectará en el mapa basándose en la dirección o coordenadas registradas.
 - **Alertas de Cobertura**: El GIS resaltará en rojo las calles donde Odoo dice que "no hay nada" para que el coordinador decida si es un error de carga o si realmente no hay luminarias en esa zona.
 
 ---
 
 **Preparado por:** Antigravity AI
**Para:** Municipalidad de Chajarí
