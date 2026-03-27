# Handoff para Agentes entre Ambientes

## Configuración Requerida por Ambiente

Este proyecto requiere configuración local en cada ambiente de desarrollo (casa, oficina, etc.).

### Archivo `.env.local` (NO versionado)

Cada ambiente debe crear su propio archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://elczfqaevdnomwflgvka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ
```

**Importante:** Este archivo está en `.gitignore` y NO se comparte entre ambientes.

### Contexto del Proyecto

El contexto para continuar el desarrollo está distribuido en:

| Archivo | Propósito |
|---------|-----------|
| `ROADMAP.md` | Estado actual, pendientes y próximos hitos |
| `DEVELOPMENT.md` | Estándares de código y seguridad |
| `docs/` | Documentación técnica y SQL de Supabase |
| `src/lib/supabase.ts` | Configuración del cliente Supabase |
| `src/stores/barrioStore.ts` | Estado global y lógica de negocio |

### Archivos Sensibles (NO versionados)

Los siguientes archivos contienen datos sensibles y no deben estar en el repositorio:

- `*.csv` - Exportaciones de datos reales
- `*.xlsx` - Spreadsheets con información sensible
- `.env.local` - Credenciales locales

Si necesitas trabajar con datos de prueba, colócalos en tu ambiente local y no los commites.

---

## Flujo de Trabajo Multi-Ambiente

```
┌─────────────┐                          ┌─────────────┐
│   Casa      │                          │   Oficina   │
│  .env.local │                          │  .env.local │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │ git commit                             │ git pull
       │ git push                               │
       ▼                                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Rama feat/*                          │
│                    (versionado)                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ PR / merge
                          ▼
┌─────────────────────────────────────────────────────────┐
│                         main                            │
└─────────────────────────────────────────────────────────┘
```

### Checklist al Cambiar de Ambiente

1. `git pull` para obtener últimos cambios
2. Verificar que `.env.local` existe (crear si no está)
3. `npm install` si hay nuevas dependencias
4. `npm run dev` para iniciar el servidor

---

## Estado Actual de Desarrollo

- **Rama Activa:** `feat/heat-maps` (Sincronizada con GitHub)
- **Hito Alcanzado:** Refactor de alto rendimiento para Mapas de Calor.
- **Cambios Clave:**
  - Uso de `useRef` y `setLatLngs()` para actualizaciones ultra-fluidas.
  - Multi-selección funcional en Desktop y Móvil.
  - Inteligencia de capa basada en ratio de densidad.
- **Documentación Final:** `HEAT_MAPS.md`.

**Actualizado:** 2026-03-27
**Motivo:** Cierre de jornada con refactor de rendimiento y soporte móvil completado.
