# PROPUESTA DE EVOLUCIÓN: PLATAFORMA GIS MUNICIPAL

> **Fecha:** Abril 2026
> **Estado:** Propuesta técnica
> **Confidencial:** Este documento contiene estrategia técnica interna

---

## 1. VISIÓN DEL PROYECTO

El sistema actual es una **herramienta de relevamiento de campo** para rastrear el progreso de tareas municipales (iluminación).

### Visión a Largo Plazo

Evolucionar hacia una **Plataforma de Gestión Espacial Municipal** capaz de gestionar:

- Relevamientos de campo
- Inventarios de infraestructura
- Datasets espaciales
- Activos municipales
- Flujos de inspección
- Capas de planificación urbana
- Datasets ambientales

### Integración con ERP

Potencial integración con sistemas ERP municipales como **Odoo** para sincronización bidireccional de datos.

---

## 2. ESTADO ACTUAL DEL REPOSITORIO

### Estructura Detectada

```
mapa-relevamientos-municipales/
├── src/
│   ├── components/        # 16 componentes React
│   ├── pages/            # 3 vistas principales
│   ├── stores/           # 1 store Zustand (barrioStore.ts)
│   ├── types/            # Interfaces TypeScript
│   ├── lib/              # Utilidades, Supabase client
│   └── data/             # GeoJSON de barrios
├── supabase/
│   ├── migrations/       # 6 migraciones SQL
│   └── hardening.sql     # Scripts de seguridad
├── docs/                 # Documentación técnica
└── scripts/              # Scripts de prueba
```

### Patrón Arquitectónico

**Monolito modular** con:
- State management centralizado (Zustand)
- Composición de componentes
- Sincronización bidireccional con PostgreSQL/PostGIS
- Persistencia parcial en localStorage

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| State | Zustand + persistencia |
| Mapas | Leaflet + react-leaflet |
| GIS | @turf/turf + PostGIS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

---

## 3. ANÁLISIS DE CALIDAD DE CÓDIGO

### Fortalezas

- Arquitectura clara con separación de concerns
- TypeScript bien utilizado con tipos definidos
- Composición de componentes React
- Persistencia inteligente (localStorage + Supabase)
- GeoJSON bien integrado con PostGIS

### Riesgos y Limitaciones

| Área | Riesgo | Impacto |
|------|--------|---------|
| **Auth** | Admin hardcodeado por email | Seguridad limitada |
| **Escala** | Sin paginación de puntos | Problemas con >10k puntos |
| **Offline** | Sin Service Worker | No funciona sin internet |
| **Mapa Base** | Solo OSM y ESRI | Sin mapas catastrales |
| **Validación** | Validación客户端 | Posibles inconsistencias |
| **Store** | 834 líneas en un solo archivo | Difícil mantenimiento |

---

## 4. MODELO DE DOMINIO DETECTADO

### Entidades Implícitas

| Entidad | Descripción | Tabla Supabase |
|---------|-------------|---------------|
| **Barrio** | Unidad geográfica de relevamiento | `barrios` |
| **PuntoRelevamiento** | Luminaria/punto de datos | `puntos_relevamiento` |
| **Jornada** | Día de trabajo de campo | `jornadas_relevamiento` |
| **Tarea** | Asignación de trabajo | `tareas_relevamiento` |
| **Config** | Parámetros del sistema | `app_config` |

### Relaciones

```
Barrio (1) ──── (N) PuntoRelevamiento
Barrio (1) ──── (N) Jornada
Barrio (1) ──── (N) Tarea
```

---

## 5. CAPACIDADES GEOSPACIALES

### Estado Actual

- ✅ Almacenamiento de geometrías (PostGIS)
- ✅ Renderizado de mapas (Leaflet)
- ✅ GeoJSON import/export
- ✅ Clustering de puntos
- ✅ Mapas de calor
- ✅ Conversión de coordenadas
- ✅ Cálculo de superficies (turf/area)

### Requerido para Plataforma GIS

| Capacidad | Estado | Acción |
|----------|--------|--------|
| Editor de polígonos | ❌ | Implementar Leaflet.Draw |
| Geocoding | ❌ | Integrar Nominatim |
| WMS/WFS | ❌ | Agregar soporte TileLayer |
| Spatial queries | ⚠️ Parcial | Extender RPC functions |
| Índices espaciales | ⚠️ PostGIS | Verificar ST_Indexes |
| Catálogo de datos | ❌ | Crear módulo nuevo |

---

## 6. POTENCIAL DE INTEROPERABILIDAD

### APIs y Servicios

| Tipo | Potencial | Implementación |
|------|-----------|----------------|
| REST API | ✅ Supabase | Ya disponible |
| GraphQL | ⚠️ No | Agregar cliente |
| Webhooks | ⚠️ No | Configurar triggers |
| ETL Pipelines | ✅ Scripts | Reutilizar existente |
| Odoo Sync | ✅ Parcial | Ampliar importador |

### Integraciones Detectadas

```
Odoo (ERP Externo)
       │
       ▼
┌─────────────────┐
│ Importador CSV   │ ◄── Luminarias_*.csv
│ (ImportadorDatos.tsx)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase        │
│ (puntos_relevamiento)
└─────────────────┘
```

### Recomendaciones de Integración

1. **Odoo Sync**: Implementar API REST bidireccional
2. **Scheduled Jobs**: Webhooks de Supabase para sincronización periódica
3. **Event-driven**: Triggers en PostgreSQL para actualizar Odoo

---

## 7. ESTRATEGIA DE REFACTOR

### Principios

1. **No reescribir** - Evolucionar incrementalmente
2. **Preservar funcionalidad** - Cada cambio debe mantener backward compatibility
3. **Modularizar progresivamente** - Extraerdominios gradualmente
4. **Documentar decisiones** - Mantener ADR (Architecture Decision Records)

### Plan de Refactor

#### Fase 1: Limpieza (1-2 sprints)

```
 ANTES                              DESPUÉS
┌──────────────────────┐     ┌──────────────────────┐
│ barrioStore.ts       │     │ stores/
│ (834 líneas)         │     │ ├── barrioStore.ts    │
│                      │     │ ├── mapStore.ts       │
│                      │     │ └── userStore.ts      │
└──────────────────────┘     └──────────────────────┘
```

#### Fase 2: Extracción de Módulos

```
src/
├── features/
│   ├── surveying/           # Relevamientos
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── neighborhoods/       # Barrios
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── map/                 # Mapa
│       ├── components/
│       ├── hooks/
│       └── layers/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── App.tsx
```

#### Fase 3: Service Layer

```
src/services/
├── api/
│   ├── supabase.ts
│   ├── odoo.ts
│   └── external.ts
├── geo/
│   ├── postgis.ts
│   ├── geojson.ts
│   └── spatial.ts
└── sync/
    ├── odooSync.ts
    └── offlineSync.ts
```

---

## 8. ARQUITECTURA FUTURA DE LA PLATAFORMA

```
┌─────────────────────────────────────────────────────────────────┐
│                     MUNICIPAL GIS PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Surveys    │  │  Assets     │  │  Datasets   │            │
│  │  Module     │  │  Registry   │  │  Catalog    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                    ┌──────▼──────┐                               │
│                    │  Map Engine │                               │
│                    │  (Leaflet)  │                               │
│                    └──────┬──────┘                               │
│                          │                                      │
│         ┌────────────────┼────────────────┐                    │
│         │                │                │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐            │
│  │  PostGIS    │  │  WMS/WFS    │  │  Vector     │            │
│  │  Storage    │  │  Services   │  │  Tiles      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     INTEGRATION LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Odoo    │  │  IGN     │  │  IDERCON │  │  Custom  │        │
│  │  Sync    │  │  WMS     │  │  WFS     │  │  APIs    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Módulos Propuestos

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **Survey Management** | Gestión de relevamientos, jornadas, equipos | Alta |
| **Spatial Dataset Management** | Catálogo de capas GIS, metadatos | Media |
| **Municipal Asset Registry** | Inventario de activos urbanos | Media |
| **Integration Layer** | Conectores Odoo, APIs externas | Alta |
| **Import/Export Pipelines** | ETL para datos geográficos | Alta |
| **Spatial APIs** | Endpoints REST/GraphQL | Baja |
| **Administration Panel** | Configuración multi-tenant | Baja |

---

## 9. ROADMAP TÉCNICO DE EVOLUCIÓN

### Stage 1: Estabilización (Sprint 1-2)

**Objetivo:** Mejorar fundamentos sin cambiar funcionalidad visible

- [ ] Migrar auth a tabla `usuarios` con roles
- [ ] Implementar paginación en `fetchBarrios` y `fetchOfficialPoints`
- [ ] Agregar logging de auditoría (trigger en Supabase)
- [ ] Tests unitarios con Vitest para core logic
- [ ] Documentar ADR para decisiones arquitectónicas

**Entregable:** Base sólida para desarrollo futuro

---

### Stage 2: Límites de Dominio (Sprint 3-4)

**Objetivo:** Desacoplar el store monolítico

- [ ] Extraer `mapStore.ts` (capas, filtros, zoom)
- [ ] Extraer `userStore.ts` (auth, sesión, permisos)
- [ ] Extraer `configStore.ts` (parámetros globales)
- [ ] Implementar паттерн Feature-based folder structure
- [ ] Agregar typed hooks para cada store

**Entregable:** Código modular fácil de mantener

---

### Stage 3: Capacidades GIS (Sprint 5-7)

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
