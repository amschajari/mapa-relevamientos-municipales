# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos de Desarrollo

```bash
npm install        # Instalar dependencias
npm run dev        # Desarrollo con hot reload (puerto 5173)
npm run build      # Build de producción
npm run preview    # Preview del build
npm run lint       # ESLint
npm run test       # Vitest
npm run deploy     # Deploy a GitHub Pages
```

## Arquitectura del Sistema

### Contexto
Sistema de control de relevamientos municipales para la **Municipalidad de Chajarí**. Los datos maestros de luminarias están en Odoo; este sistema es una herramienta interna para coordinar recorridos y visualizar progreso por barrios.

### Stack
- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 + clsx/tailwind-merge para utilidades
- Zustand con persistencia en localStorage
- Leaflet + react-leaflet para mapas
- Supabase (opcional - para sincronización futura)
- @turf/turf para cálculos geoespaciales

### Estructura de Código

```
src/
├── components/       # Componentes UI reutilizables
│   ├── ControlMap.tsx         # Mapa con polígonos de barrios
│   ├── BarrioDetailModal.tsx  # Modal de edición de barrio
│   ├── Sidebar.tsx            # Navegación lateral
│   └── ...
├── pages/            # Vistas principales
│   ├── DashboardView.tsx      # Métricas y resumen
│   └── BarriosView.tsx        # Lista con filtros
├── stores/
│   └── barrioStore.ts         # Estado global + lógica Supabase
├── types/
│   └── index.ts               # Tipos TypeScript
├── data/
│   └── barrios-chajari.json   # GeoJSON de barrios (45 barrios)
└── lib/
    ├── utils.ts               # Utilidades UI (clsx + tailwind-merge)
    ├── geoUtils.ts            # Utilidades geoespaciales
    ├── projectionUtils.ts     # Proyección de estimados
    └── supabase.ts            # Cliente Supabase
```

### Flujo de Datos

1. **Barrios** se cargan desde `barrios-chajari.json` (GeoJSON) + Supabase (estado/progreso)
2. **Estado** se gestiona con Zustand (`barrioStore.ts`) con persistencia parcial en localStorage
3. **Sincronización**: Al iniciar, se sincroniza GeoJSON con Supabase vía `initializeFromGeoJSON()`
4. **Path aliases**: `@/*` mapea a `src/*` (configurado en `tsconfig.json` y `vite.config.ts`)

### Tipos Clave

```typescript
type EstadoBarrio = 'pendiente' | 'progreso' | 'completado' | 'pausado'

interface Barrio {
  id: string
  nombre: string
  estado: EstadoBarrio
  progreso: number           // 0-100
  superficie_ha?: number
  luminariasEstimadas?: number
  luminariasRelevadas?: number
  geojson?: any              // Feature GeoJSON para validación espacial
}
```

### Decisiones Técnicas

- **Zustand + localStorage**: Prioriza velocidad y uso offline. Supabase es opcional para sincronización.
- **Leaflet**: Open source, sin API key, compatible con GeoJSON local.
- **Colores de barrios**: Pendiente (gris), En Progreso (naranja), Completado (verde), Pausado (rojo).
- **Estimación de luminarias**: ~4 por hectárea (ajustable vía `projectionUtils.ts`).

## Producción

- **URL**: https://amschajari.github.io/mapa-relevamientos-municipal/
- **Deploy**: Automático con cada push a `main` via GitHub Actions

## Notas para Desarrolladores

- El estado se persiste automáticamente en localStorage (parcial: barrios, tareas, activeBaseMap, mapFilters)
- Para agregar barrios, editar `src/data/barrios-chajari.json`
- El usuario admin se determina por email: `a.m.saposnik@gmail.com`
- Requiere conexión a internet para OpenStreetMap tiles
