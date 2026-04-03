# ACTA DE DISEÑO - SISTEMA GIS MUNICIPAL

> **Documento iterable:** Este archivo registra la evolución del diseño del sistema.
> Cada sesión de diseño genera una nueva versión que se incorpora aquí.

---

## HISTORIAL DE REVISIONES

| Fecha | Versión | Resumen |
|-------|---------|---------|
| 2026-04-01 | v0.1 | Acta inicial - Definición de visión y arquitectura conceptual |

---

## ACTA v0.1 - 2026-04-01

### Participantes

- Equipo Municipal de Chajarí

### Contexto del Proyecto

El sistema actual es una **herramienta de relevamiento de campo** para rastrear el progreso de tareas municipales (iluminación). Está desarrollado con React + TypeScript + Supabase + PostGIS + Leaflet.

### Visión del Sistema

Evolucionar hacia una **Plataforma GIS Municipal Modular y Escalable** que:

1. **Se nutre de Odoo** como fuente de datos operativa
2. **Crece en capas** de forma incremental:
   - Capa 1: Luminarias (en curso)
   - Capa 2: Espacios verdes
   - Capa 3: Arbolado urbano
   - Capa 4: Calles pavimentadas
   - (y más según necesidad...)
3. **Gestión interna** vía Odoo
4. **Capas públicas** para transparencia democrática (gestión abierta)

### Arquitectura Conceptual

```
┌─────────────────────────────────────────────────────────┐
│                    GIS MUNICIPAL PLATFORM                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  CAPA       │    │  CAPA       │    │  CAPA       │  │
│  │  Luminarias │    │  Espacios   │    │  Arbolado   │  │
│  │             │    │  Verdes     │    │  Urbano     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │  MAP ENGINE   │                     │
│                    │  (Leaflet)    │                     │
│                    └───────┬───────┘                     │
│                            │                             │
│         ┌──────────────────┼──────────────────┐        │
│         │                  │                  │         │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐  │
│  │  ODOO       │    │  SUPABASE   │    │  CAPAS      │  │
│  │  (Backend)  │    │  (API/BD)   │    │  PÚBLICAS   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Modelo de Capas Genérico (Patrón)

Cada capa GIS compartirá una estructura común:

```
Capa {
  id: string
  tipo: 'luminaria' | 'espacio_verde' | 'arbolado' | ...
  geometria: Point | Polygon | LineString
  atributos: JSON (específicos por tipo)
  metadata: {
    created_at: timestamp
    updated_at: timestamp
    source: 'odoo' | 'campo' | 'ciudadano'
    estado: 'activo' | 'inactivo' | 'en_revision'
  }
  relaciones: {
    barrio_id: string (FK)
    jornada_id?: string (FK, si fue cargado en relevamiento)
  }
}
```

### Preguntas Pendientes de Responder

| # | Pregunta | Estado | Notas |
|---|----------|--------|-------|
| 1 | ¿Lista completa de capas planificadas? | ⏳ Pendiente | Necesario para modelar schema genérico |
| 2 | ¿Niveles de autenticación? (admin/operador/supervisor/ciudadano/público) | ⏳ Pendiente | Define permisos por rol |
| 3 | ¿Odoo tiene coordenadas en luminarias o solo datos alfanuméricos? | ⏳ Pendiente | Impacta estrategia de importación |
| 4 | ¿Supabase se mantiene como API/BD o se considera migrar? | ⏳ Pendiente | Dependencia técnica |
| 5 | ¿Las capas públicas son solo lectura o ciudadanos pueden reportar? | ⏳ Pendiente | Ej: "reportar luminaria rota" |

### Decisiones Tomadas

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | Mantener la estructura actual del repositorio como base | Ya tiene el stack definido y funcionando |
| 2 | Evolución incremental, no reescritura | Preserva funcionalidad existente |
| 3 | Patrón de capas genérico | Permite agregar nuevas capas sin cambios en arquitectura |
| 4 | Odoo como fuente de datos operativa | Ya está en uso, es el sistema de gestión municipal |

### Próximos Pasos

1. [ ] Responder preguntas pendientes del cuadro anterior
2. [ ] Definir schema genérico para capas
3. [ ] Diseñar modelo de autenticación y permisos
4. [ ] Crear ADR (Architecture Decision Records) para decisiones técnicas
5. [ ] Implementar primera iteración

---

## NOTAS DE SESIÓN

*(Agregar notas relevantes de cada sesión de diseño)*

---

## REFERENCIAS

- Repositorio: `mapa-relevamientos-municipales`
- Docs relacionados: `PROPUESTA_EVOLUCION_PLATAFORMA_GIS.md`
- Odoo: Sistema de gestión municipal (fuente de datos)
- Supabase: API y base de datos PostGIS
