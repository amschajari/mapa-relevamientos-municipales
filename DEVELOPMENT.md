# Guía de Desarrollo - Sistema de Relevamientos Municipales

Este documento establece los estándares de calidad, seguridad y flujo de trabajo para el proyecto.

## 1. Estándares de Codificación
- **React + TypeScript**: Seguir patrones funcionales y hooks.
- **Zustand**: Para manejo de estado global (ver `src/store/barrioStore.ts`).
- **Tailwind CSS**: Estilos consistentes usando tokens del sistema.
- **Leaflet**: Mapas interactivos optimizados.

## 2. Seguridad (Security Coding)
- **Supabase RLS**: Todas las tablas deben tener Row Level Security (RLS) habilitado.
- **Validación de Roles**: Diferenciar entre `admin` (a.m.saposnik@gmail.com) y operarios.
- **OWASP**: Seguir principios básicos de seguridad web (XSS, CSRF, Inyección).
- **Secretos**: NUNCA subir archivos `.env` o credenciales al repositorio.

## 3. Flujo de Trabajo (Vibecoding / Agentic)
- **Contexto**: Antes de cada sesión, leer `ROADMAP.md`.
- **Regla de Continuidad**: Antes de finalizar una sesión de trabajo exitosa (commit/push), el agente o desarrollador debe actualizar el `ROADMAP.md` con los avances realizados, pendientes inmediatos y cualquier cambio de rumbo.
- **Estandarización**: Usar los workflows definidos en `.agent/workflows`.
- **Iteración**: Cambios pequeños y frecuentes, validados mediante `npm run build` o pruebas.

## 4. Revisión de Código
- Enfoque en: Performance ( Leaflet layers), legibilidad y seguridad.
- Documentar cambios significativos en la hoja de ruta.
