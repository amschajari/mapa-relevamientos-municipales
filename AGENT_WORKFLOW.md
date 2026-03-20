# Workflow de Agentes - Sistema de Relevamientos Municipales

> **Documento maestro para continuidad entre ambientes (casa/oficina) y sesiones de desarrollo**

**Última actualización:** 2026-03-19
**Motivo:** Correcciones de seguridad + flujo multi-ambiente

---

## 🔐 Configuración de Seguridad por Ambiente

### Archivo `.env.local` (NO versionado)

Cada ambiente (casa, oficina) debe crear su propio `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://elczfqaevdnomwflgvka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ
```

**Nunca commites este archivo.** Está en `.gitignore`.

### Archivos Sensibles (NO versionados)

| Tipo | Patrón | Razón |
|------|--------|-------|
| Credenciales | `.env.local` | Contiene claves de API |
| Datos reales | `*.csv`, `*.xlsx` | Exportaciones de producción |
| Logs | `*.log` | Pueden contener información sensible |

---

## 🔄 Flujo Casa ↔ Oficina

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO MULTI-AMBIENTE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CASA                         OFICINA                           │
│  .env.local                 .env.local                          │
│  (local)                    (local)                             │
│    │                            │                               │
│    │ git commit                 │ git pull                      │
│    │ git push                   │                               │
│    ▼                            ▼                               │
│    └─────────→ feat/* ←─────────┘                               │
│              (versionado)                                       │
│                    │                                            │
│                    │ PR / merge                                 │
│                    ▼                                            │
│                  main                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist al Cambiar de Ambiente

1. `git pull origin feat/csv-import-strategy` (o tu rama activa)
2. Verificar `.env.local` (crear si falta con el script abajo)
3. `npm install` si hay nuevas dependencias en `package.json`
4. `npm run dev` para iniciar el servidor

### Script para crear `.env.local` (Bash/PowerShell)

```bash
# Bash (Git Bash, Linux, Mac)
cat > .env.local << EOF
VITE_SUPABASE_URL=https://elczfqaevdnomwflgvka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ
EOF

# PowerShell (Windows)
@"
VITE_SUPABASE_URL=https://elczfqaevdnomwflgvka.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY3pmcWFldmRub213ZmxndmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDQ4ODMsImV4cCI6MjA4NzAyMDg4M30.HL9I0zzJTmhxVMd2oTbYLupgNfio_yLZ1StG9voexWQ
"@ | Out-File -FilePath .env.local -Encoding utf8
```

---

## 📚 Contexto Esencial para Retomar Desarrollo

### Archivos que TODO agente debe leer

| Prioridad | Archivo | Propósito |
|-----------|---------|-----------|
| 🔴 Alta | `ROADMAP.md` | Estado actual, hitos, próximos pasos |
| 🔴 Alta | `AGENT_WORKFLOW.md` (este) | Configuración y flujo |
| 🟡 Media | `DEVELOPMENT.md` | Estándares de código |
| 🟡 Media | `docs/*.sql` | Esquema de Supabase |
| 🟢 Baja | `src/lib/supabase.ts` | Cliente DB (usa .env.local) |

### ¿Dónde está la lógica de negocio?

- **Estado global:** `src/stores/barrioStore.ts`
- **Componentes UI:** `src/components/`
- **Utilidades:** `src/lib/`
- **Tipos:** `src/types/index.ts`

---

## 🛠️ Estándares de Desarrollo

### Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| React 18 + TypeScript | Componentes funcionales |
| Zustand | Estado global (barrioStore) |
| Leaflet | Mapas interactivos |
| Tailwind CSS | Estilos |
| Supabase | Auth + DB + RLS |
| Turf.js | Geoprocessing (auditoría) |

### Principios de Código

1. **Componentes dentro de MapContainer** usan `useMap()` de Leaflet
2. **Lógica pesada** en `barrioStore.ts`, no en componentes
3. **Validación de roles** en todo botón de edición (solo admin)
4. **RLS habilitado** en todas las tablas de Supabase

### Seguridad (OWASP)

- XSS: Usar `{children}` en React, nunca `dangerouslySetInnerHTML`
- CSRF: Supabase maneja tokens automáticamente
- Inyección: Usar queries parametrizadas de Supabase
- Datos sensibles: Nunca en el repo, solo en `.env.local`

---

## 📝 Rutina de Trabajo del Agente

### Al Iniciar Sesión

1. Leer `ROADMAP.md` para contexto actual
2. Verificar rama: `git status`
3. Si es primera vez en este ambiente: crear `.env.local`

### Al Finalizar Sesión (ÉXITO)

1. Commit con mensaje descriptivo
2. Push a la rama `feat/*`
3. **Actualizar `ROADMAP.md`** con:
   - Lo completado
   - Pendientes inmediatos
   - Cualquier cambio de rumbo

### Comandos Frecuentes

```bash
# Ver estado
git status

# Commitar cambios
git add .
git commit -m "feat: descripción del cambio"

# Subir a la rama
git push

# Actualizar desde remote
git pull
```

---

## 🚨 Troubleshooting

### Problema: "No auth session"
**Causa:** `.env.local` falta o credenciales incorrectas
**Solución:** Recrear `.env.local` con script de arriba

### Problema: "Barrios no se cargan"
**Causa:** RLS de Supabase bloquea lectura
**Solución:** Verificar `src/stores/barrioStore.ts` y políticas en Supabase dashboard

### Problema: "CSV no importa"
**Causa:** Archivo en cache del navegador o formato inválido
**Solución:** Hard refresh (Ctrl+Shift+R) o verificar formato Odoo esperado

---

## 📊 Estado Actual del Proyecto (Resumen)

### ✅ Completado
- Importador V2 con validación geoespacial
- Auth con Supabase (admin/operario)
- Multi-ambiente documentado
- Seguridad: credenciales en .env.local

### 🔄 En Progreso
- Rama: `feat/csv-import-strategy`
- Focus: Optimización de importación CSV

### 📋 Próximos Hitos
1. Dashboard de reporte para autoridades
2. Auditoría espacial (Turf.js para outliers)
3. Generación de PDFs por barrio

---

**Este documento se autoactualiza.** Cada agente que modifique el flujo debe commitear cambios aquí.
