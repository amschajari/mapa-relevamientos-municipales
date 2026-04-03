# PROPUESTA DE EVOLUCIÓN: PLATAFORMA GIS MUNICIPAL

> **Fecha:** Abril 2026
> **Estado:** Propuesta técnica (Actualizada)
> **Confidencial:** Este documento contiene estrategia técnica interna

---

## 1. VISIÓN DEL PROYECTO

El sistema actual es una **herramienta de relevamiento de campo** para rastrear el progreso de tareas municipales (iluminación).

### Visión a Largo Plazo

Evolucionar hacia una **Plataforma de Gestión Espacial Municipal** capaz de gestionar:

- Relevamientos de campo
- Inventarios de infraestructura (Luminarias, Arbolado, Espacios Verdes)
- Datasets espaciales y capas de catastro
- Activos municipales en tiempo real
- Flujos de inspección y reclamos
- Capas de planificación urbana e indicadores ambientales

### Integración con ERP (Odoo)

Potencial integración con el sistema ERP municipal **Odoo** para sincronización bidireccional de datos de activos fijos y mantenimiento.

---

## 2. ESTADO ACTUAL DEL REPOSITORIO

### Estructura Detectada

```
mapa-relevamientos-municipales/
├── src/
│   ├── components/        # Componentes React (Login, Mapa, Sidebar)
│   ├── pages/            # Vistas (Dashboard, Equipos, Barrios)
│   ├── stores/           # Store Zustand (barrioStore.ts - Candidato a refactor)
│   ├── types/            # Interfaces TypeScript
│   ├── lib/              # Utilidades, Supabase client
│   └── data/             # GeoJSON de barrios
├── supabase/
│   ├── migrations/       # Migraciones SQL (Tablas y RLS)
│   └── hardening.sql     # Scripts de seguridad
├── docs/                 # Documentación técnica y actas
└── scripts/              # Scripts de utilidad y mantenimiento
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| State | Zustand + persistencia local |
| Mapas | Leaflet + react-leaflet |
| GIS | @turf/turf + PostGIS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Integrado) |

---

## 3. ANÁLISIS DE CALIDAD DE CÓDIGO

### Fortalezas
- Arquitectura clara con separación de responsabilidades.
- TypeScript bien utilizado para seguridad de datos.
- Sincronización robusta con PostgreSQL/PostGIS.

### Riesgos y Limitaciones actuales
- **Escala**: Necesita paginación para manejar >10k puntos.
- **Store**: `barrioStore.ts` (+800 líneas) es un monolito difícil de mantener.
- **Offline**: Requiere Service Worker para trabajo en campo sin señal.

---

## 5. CAPACIDADES GEOSPACIALES

### Estado Actual
- ✅ Almacenamiento de geometrías (PostGIS).
- ✅ Renderizado de mapas y clustering.
- ✅ Mapas de calor y conversión de coordenadas.

### Requerido para Plataforma GIS Pro
- [ ] **Editor de polígonos**: Implementar `Leaflet.Draw` para editar barrios en vivo.
- [ ] **Geocoding**: Integración con Nominatim o Google Maps.
- [ ] **WMS/WFS**: Soporte para capas oficiales de **IDERA** o Catastro Provincial.

---

## 6. INTEGRACIÓN CON ODOO (Estrategia)

### ¿Directo o Mediante Puente?

Para mantener una arquitectura **SaaS Escalable**, se propone el uso de **Supabase Edge Functions** como puente de seguridad:

1. **Odoo (ERP)**: Fuente primaria del dato (Inventario).
2. **Supabase (Bridge)**: Caché espacial que traduce datos de Odoo a geometrías PostGIS.
3. **Plataforma GIS**: Consumo rápido y seguro de datos ya procesados.

*Beneficio: Seguridad total de las credenciales de Odoo y performance de mapa superior.*

---

## 13. EJE DE TRANSPARENCIA Y GESTIÓN PÚBLICA

La evolución del sistema contempla una **"Vista de Ciudadano"** integrable en `chajari.gob.ar`:

- **Transparencia Activa**: Publicación de mapas de avance de gestión (pavimentación, recambio LED, obras hídricas).
- **Impacto**: Pasar de reportes en PDF estáticos a un Mapa Vivo de Gestión.
- **Implementación**: Creación de una versión Read-Only del mapa embebible mediante `<iframe>` o subdominio oficial.

---

## ANEXO A: PROTOCOLO DE MIGRACIÓN INSTITUCIONAL

Para trasladar el proyecto desde la propiedad personal (Alejandro) al espacio exclusivo de la Municipalidad de Chajarí:

### Paso 1: Infraestructura Git (GitHub)
- Crear una **GitHub Organization** oficial (ej: `munichajari-it`).
- Transferir la propiedad del repositorio o realizar un clon limpio.

### Paso 2: Infraestructura de Datos (Supabase)
- Crear un nuevo proyecto en Supabase con correo institucional.
- Ejecutar los scripts de `supabase/migrations` para recrear las tablas y políticas RLS.
- Exportar/Importar datos mediante archivos SQL o CSV.

### Paso 3: Configuración de Entorno
- Actualizar las variables de entorno (`.env`) con la nueva `SUPABASE_URL` y `KEY`.
- Re-invitar a los usuarios (técnicos) al nuevo sistema mediante sus correos oficiales.

---

> **Nota Final:** Este documento es una hoja de ruta viva. Todas las decisiones técnicas priorizan la soberanía de datos del municipio y la flexibilidad del desarrollador.
ge 3: Capacidades GIS (Sprint 5-7)

**Objetivo:** Agregar funcionalidades de plataforma GIS

- [ ] Implementar editor de polígonos (Leaflet.Draw)
- [ ] Agregar integración WMS de catastro (IDERCOR)
- [ ] Implementar geocoding (Nominatim)
- [ ] Crear módulo de exportación PDF con mapas
- [ ] Agregar slider temporal para datos históricos

**Entregable:** Plataforma GIS funcional

---

### Stage 4: Capa de Integración (Sprint 8-10)

**Objetivo:** Conectar con sistemas externos

- [ ] Implementar sync bidireccional con Odoo
- [ ] Crear API REST documentada
- [ ] Configurar webhooks para eventos
- [ ] Implementar cola de jobs para sincronización pesada
- [ ] Dashboard de monitoreo de integraciones

**Entregable:** Ecosistema conectado

---

### Stage 5: Arquitectura de Plataforma (Sprint 11+)

**Objetivo:** Escalar a multi-municipalidad

- [ ] Parametrizar por municipio (multi-tenant)
- [ ] Implementar PWA con offline sync
- [ ] Dashboard configurable por rol
- [ ] Machine Learning para predicción de duración
- [ ] App móvil nativa (React Native)
- [ ] Integración con imágenes satelitales/drones

**Entregable:** Plataforma lista para producción a escala

---

## 10. MÉTRICAS DE ÉXITO

| Métrica | Baseline | Stage 1 | Stage 3 | Stage 5 |
|---------|----------|---------|---------|---------|
| Líneas por store | 834 | <300 | <150 | <100 |
| Cobertura tests | 0% | 30% | 50% | 70% |
| Tiempo de build | ~8s | <6s | <5s | <5s |
| Módulos GIS | 2 | 2 | 6 | 10+ |
| Integraciones | 1 (Odoo CSV) | 1 | 3 | 5+ |

---

## 11. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Dependencia de Supabase | Alta | Media | Documentar abstracciones |
| Tech debt acumulado | Alta | Alta | Refactor continuo |
| Vendor lock-in | Media | Alta | Preparar abstracción de DB |
| Pérdida de datos offline | Media | Alta | Implementar backup automático |
| Performance con >100k puntos | Media | Alta | Índices espaciales + paginación |

---

## 12. PRÓXIMOS PASOS INMEDIATOS

1. **Ejecutar Stage 1 completo** antes de agregar features
2. **Crear ADR.md** para documentar decisiones
3. **Setup CI/CD** para deploy automatizado
4. **Audit de dependencias** (security updates)

---

> **Nota:** Este documento es una propuesta de evolución. Las prioridades y timelines deben validarse con stakeholders antes de implementación.
