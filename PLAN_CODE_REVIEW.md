# Plan de Code Review, Seguridad y Mejora de DX

Este documento detalla la estrategia para auditar el repositorio de **Mapa de Relevamientos Municipales**, asegurando la integridad de los datos, la calidad del código y la optimización de los flujos de trabajo del agente.

## 1. Auditoría de Seguridad (Secretos y Sensibilidad)
- **Escaneo de Git**: Verificar si existen `SUPABASE_KEY` o `SERVICE_ROLE_KEY` en el historial de commits.
- **Validación de .gitignore**: Asegurar que archivos como `.env.local`, `*.csv` (con datos reales) y `/dist` no se suban accidentalmente.
- **Auditoría de RLS**: Comprobar que todas las tablas de Supabase en `supabase/migrations` tengan habilitado el Row Level Security (RLS) y políticas restrictivas por rol.

## 2. Revisión de Buenas Prácticas (Código)
- **TypeScript Strict**: Eliminar el uso de `any` en componentes críticos como `ControlMap.tsx` y `barrioStore.ts`.
- **Zustand Patterns**: Verificar que las acciones del store no causen re-renders innecesarios en el mapa.
- **Leaflet Layer Management**: Auditar la carga y descarga de capas (Heatmaps, Clustering) para prevenir fugas de memoria.

## 3. Mejora de Herramientas (Workflows & Skills)

### Nuevos Workflows (`.agent/workflows/`)
- **/deploy**: Guía para el build y publicación en `gh-pages` con validación previa.
- **/mobile-check**: Checklist interactivo para validar la UI en dispositivos móviles tras cambios en leyendas o marcadores.
- **/setup-dev**: Instrucciones para configurar el entorno desde cero (npm install, variables de entorno).

### Nuevas Skills (`.agent/skills/`)
- **data-manager**: Habilidad para realizar importaciones masivas de datos (CSV a Supabase) validando duplicados.
- **performance-auditor**: Habilidad para medir y reportar el impacto de rendering en el mapa Leaflet.

## 4. Próximos Pasos Específicos
1. Identificar si hay lógica de negocio duplicada entre `Sidebar.tsx` y `MobileMapControls.tsx`.
2. Estandarizar el manejo de errores en las peticiones a Supabase.
3. Evaluar la migración a una estructura de carpetas más modular (ej. `/features/relevamientos`).

---
*Última actualización: 27/03/2026 - Generado por Antigravity*
