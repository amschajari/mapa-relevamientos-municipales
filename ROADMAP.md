# HOJA DE RUTA Y CONTEXTO DE DESARROLLO - 12/03/2026
## Sistema de Control de Relevamientos - Municipalidad de Chajarí

Este documento sirve como guía para el desarrollo continuo y transferencia de contexto entre agentes de IA y desarrolladores.

---

## 1. Resumen de Implementación Actual (Checkpoint)
- **Mapa Leaflet**: Refactorizado para usar `BarriosLayer` dentro de `MapContainer`.
- **Reactividad**: Estado `selectedBarrio` centralizado en `barrioStore.ts` (Zustand).
- **Estándares**: `DEVELOPMENT.md` y `ROADMAP.md` establecidos para continuidad de contexto.
- **Agentic Workflows**: Directorio `.agent/workflows` configurado para automatización.
- **Calidad**: Vitest configurado para pruebas unitarias.
- **Persistencia**: Sincronización con Supabase.

---

## 2. Definiciones de Funcionalidad y Dudas a Rever

### 📊 Barra de "Progreso del Relevamiento"
- **Duda**: ¿Es realmente necesaria una barra de % fijo por barrio?
- **Contexto**: No hay un total de luminarias real (las ~3000 actuales son ficticias).
- **Propuesta**: 
    - Reemplazar por **"Conteo de Luminarias Relevadas"** (valor absoluto).
    - Usar estados visuales de "Saturación" en el mapa: a más puntos relevados, más intenso el color del barrio, sin depender de un % de "techo" desconocido.
    - Evaluación de workflow: El progreso debería marcarse como "Terminado" manualmente por el coordinador tras una inspección visual, no solo por alcanzar un número.

### 👥 Gestión de Equipos y Operarios
- **Actual**: 2 personas iniciales en horario vespertino.
- **Evolución**: El sistema debe permitir asignar "Operarios" individuales a tareas, no solo "Equipos" genéricos.
- **Acción**: Ajustar `TaskAssignmentModal` para que sea una lista de operarios activos.

### 🗺️ Geometría y Polígonos (QGIS)
- **Origen**: Base QGIS (EPSG:4326/WGS84).
- **Necesidad**: Poder editar vértices o añadir barrios desde la UI.
- **Workflow AI**: Si se requiere un nuevo barrio, el agente debe buscar el GeoJSON base en `src/data/barrios-chajari.json` y actualizarlo o preparar una función de importación.

---

## 3. Seguridad y Roles (Master Admin)
- **Usuario Master**: `a.m.saposnik@gmail.com`
- **Permisos**: Solo este usuario (o usuarios validados) deben ver los iconos de edición (lápiz) y botones de "Guardar".
- **Estado**: Por implementar (Supabase Auth + RLS).

---

## 4. Próximos Pasos Técnicos
1. **Fijar base de datos real**: Eliminar datos ficticios de luminarias y empezar el conteo desde cero.
2. **Integración Odoo**: Investigar endpoint de "Atención al Vecino" para visualizar tickets sobre el mapa.
3. **Optimización de Capas**: Leaflet puede ralentizarse con muchos puntos; evaluar `L.canvas` o clustering si el número de luminarias crece mucho.

---

**Nota para futuros agentes**: 
El proyecto usa una estructura de carpetas limpia en `/src`. Los estilos son Tailwind neutros/profesionales. La lógica de negocio pesada debe residir en `barrioStore.ts`. Siempre verificar que `useMap` se use dentro de componentes hijos de `MapContainer`.
