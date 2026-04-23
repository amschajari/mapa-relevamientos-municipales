# 🗺️ HOJA DE RUTA UNIFICADA: PLATAFORMA GIS MUNICIPAL

## 💎 Visión Estratégica (Actualizada Abril 2026)
Evolucionar de una herramienta de relevamiento a una **Plataforma de Gestión Espacial Municipal (SaaS)**. 
*Referencia principal:* [PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md](file:///d:/ZZ_PARA%20ANALISIS%20IA%20REPORTES/mapa-relevamientos-municipales/PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md)

---

## 🚀 Fases de Ejecución Inmediata

### Fase 1: Estabilización y Calidad (Sprints Actuales)
*Objetivo: Sentar bases sólidas sin romper la funcionalidad operativa.*
- [x] **Gestión de Skills**: Implementado `autoskills` para sincronización Casa/Oficina.
- [x] **Limpieza de UI**: Depuración del Login (Remoción de avisos redundantes y personalización).
- [x] **Planificación Capa Vial**: Diseñado el esquema PostGIS y RPC para calles pavimentadas.
- [ ] **Auditoría Espacial**: Reintroducir Turf.js para detectar puntos fuera de polígonos.
- [ ] **Refactor de Datos**: Migrar Auth a tabla de usuarios con roles (SuperAdmin/Coordinador/Operario).
- [ ] **Implementación Capa Calles**: Ejecutar SQL y crear componente `CallesPavimentadasLayer`.

### Fase 2: Modularización (La "Gran Limpieza")
- [ ] **Split del Store**: Dividir `barrioStore.ts` en `authStore`, `mapStore`, `configStore` y `surveyStore`.
- [ ] **Estructura de Carpetas**: Implementar `src/features/` para separar dominios.

### Fase 3: Capacidades GIS Pro
- [ ] **Editor Live**: Implementar herramientas de dibujo (`Leaflet.Draw`) para editar polígonos desde la web.
- [ ] **Capas IDERA**: Conectar servicios WMS oficiales.
- [ ] **Exportación**: Generador de reportes PDF por barrio sincronizados desde Odoo.

### Fase 4: Integración y Transparencia
- [ ] **Odoo API Bridge**: Conexión segura mediante Supabase Edge Functions.
- [ ] **Portal Ciudadano**: Vista pública de "Gestión Viva" para `chajari.gob.ar`.
- [ ] **Protocolo de Migración**: Preparar el traspaso a infraestructura 100% municipal.

---

## 📅 Hitos Recientes (Checkpoint 03/04/2026)
- **Sincronización de Entorno**: Configurado `skills-lock.json` para paridad de ambientes.
- **Estrategia SaaS**: Definido el protocolo de migración institucional y el eje de transparencia.
- **Limpieza de Login**: Modal de acceso profesionalizado y seguro.

---

## 🧹 Notas de Mantenimiento
- Mantener `barrioStore.ts` bajo vigilancia hasta el split de la Fase 2.
- Priorizar siempre la seguridad de las API Keys de Odoo mediante el bridge de Supabase.
- El GIS manda en la **estrategia espacial**, Odoo manda en el **dato administrativo**.

---

**Nota para futuros agentes**:
Este proyecto está en transición a una arquitectura SaaS. Seguir el esquema de `src/features` y evitar engrosar `barrioStore.ts`. Consultar siempre el [Anexo A](file:///d:/ZZ_PARA%20ANALISIS%20IA%20REPORTES/mapa-relevamientos-municipales/PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md) antes de proponer cambios en la infraestructura.
ca de negocio pesada debe residir en `barrioStore.ts`. Siempre verificar que `useMap` se use dentro de componentes hijos de `MapContainer`.
