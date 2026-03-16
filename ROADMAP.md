# HOJA DE RUTA Y CONTEXTO DE DESARROLLO - 12/03/2026
## Sistema de Control de Relevamientos - Municipalidad de Chajarí

Este documento sirve como guía para el desarrollo continuo y transferencia de contexto entre agentes de IA y desarrolladores.

---

## 1. Resumen de Implementación Actual (Checkpoint)
- **Mapa Leaflet**: Refactorizado para usar `BarriosLayer` dentro de `MapContainer`.
- **Interacción**: Mejorada la lógica de clusters (zoom + coverage) y popups enriquecidos.
- **Gestión de Estados**: Sistema de cierre manual de barrios habilitado (botón "Finalizar").
- **Auto-Inicio**: Los barrios pasan de 'Pendiente' a 'En Progreso' automáticamente al detectar actividad.
- **Estándares**: `DEVELOPMENT.md` y `ROADMAP.md` establecidos para continuidad de contexto.
- **Agentic Workflows**: Directorio `.agent/workflows` configurado para automatización.
- **Calidad**: Vitest configurado para pruebas unitarias.
- **Persistencia**: Sincronización con Supabase.

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

## 3. Seguridad y Roles (Master Admin)
- **Usuario Master**: `a.m.saposnik@gmail.com`
- **Permisos**: Solo este usuario (o usuarios validados) pueden ver los iconos de edición (lápiz) y botones de "Guardar".
- **Estado**: **Implementado** (Supabase Auth integrado con el store. LoginModal funcional).

### 🧹 Limpieza de Datos (Completada)
- **Acción**: Eliminados registros de `luminarias_estimadas` y `progreso` ficticios. 
- **Estado**: **Finalizado**. El sistema inicia en 0 para ser llenado con datos estratégicos reales.

---

## 4. Próximos Pasos Técnicos
1. **Refactor de Dashboard**: Quitar % de Odoo-ficticio y poner "Contadores de descubrimiento" y "Estatus de Barrio" (manual).
2. **Control de Capas**: Asegurar que podamos "tachar" o pintar calles recorridas manualmente desde el Dashboard.
3. **Integración Odoo**: Investigar endpoint de "Atención al Vecino" para visualizar tickets sobre el mapa.

---

**Nota para futuros agentes**: 
El proyecto usa una estructura de carpetas limpia en `/src`. Los estilos son Tailwind neutros/profesionales. La lógica de negocio pesada debe residir en `barrioStore.ts`. Siempre verificar que `useMap` se use dentro de componentes hijos de `MapContainer`.
