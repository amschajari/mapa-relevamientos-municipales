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
- Supabase (PostGIS) para datos geoespaciales
- @turf/turf para cálculos geoespaciales

### Estructura de Código

```
src/
├── components/       # Componentes UI reutilizables
│   ├── ControlMap.tsx         # Mapa principal
│   ├── PavimentoLayer.tsx      # Capa de calles pavimentadas
│   ├── ImportadorCallesPavimentadas.tsx  # Importador de calles
│   ├── ImportadorEspaciosVerdes.tsx   # Importador de espacios verdes
│   ├── ImportadorDatos.tsx   # Importador de luminarias
│   ├── Sidebar.tsx           # Navegación lateral
│   └── LayersPanel.tsx       # Panel de control de capas
├── stores/
│   ├── barrioStore.ts       # Estado de barrios
│   └── mapStore.ts         # Estado de capas y mapa
├── types/
│   └── index.ts            # Tipos TypeScript
├── data/
│   ├── barrios-chajari.json   # GeoJSON de barrios (45 barrios)
│   └── calles_ejido_reordenado.geojson  # Calles pavimentadas
└── lib/
    ├── utils.ts            # Utilidades UI
    ├── geoUtils.ts         # Utilidades geoespaciales
    └── supabase.ts          # Cliente Supabase
```

### Tablas Supabase

| Tabla | Tipo | Descripción |
|-------|-----|-------------|
| `barrios` | Polygon | Polígonos de barrios |
| `puntos_relevamiento` | Point | Luminarias relevadas |
| `espacios_verdes` | Polygon | Parques y plazas |
| `calles_pavimentadas` | MultiLineString | Calles y avenidas |

### Flujo de Datos

1. **Barrios**: GeoJSON local + Supabase (estado/progreso)
2. **Luminarias**: CSV de Odoo → Supabase con vinculación por nombre de barrio
3. **Espacios Verdes**: GeoJSON → Supabase
4. **Calles Pavimentadas**: GeoJSON → Supabase (MultiLineString)

### Importadores

- **Luminarias** (`ImportadorDatos.tsx`): CSV/GeoJSON de Odoo
- **Barrios** (`ImportadorPoligonos.tsx`): GeoJSON de polígonos
- **Espacios Verdes** (`ImportadorEspaciosVerdes.tsx`): GeoJSON
- **Calles Pavimentadas** (`ImportadorCallesPavimentadas.tsx`): GeoJSON MultiLineString

### Capas del Mapa (LayersPanel)

| Dominio | Capas | Tipo Datos |
|---------|--------|-----------|
| Luminarias | Todas, Mapa de Calor | Supabase |
| Espacios Verdes | Parques y Plazas | Supabase |
| Calles Pavimentadas | Calles, Avenidas | Supabase |
| Barrios | Polígonos | Supabase |

### Decisiones Técnicas

- **Zustand + localStorage**: Persistencia de estado UI
- **PostGIS + Supabase**: Datos geoespaciales (NO localStorage para geometrías)
- **Bulk insert**: Importadores usan lotes de 100 registros
- **Coincidencia exacta**: Para vincular puntos a barrios (evitar subcadenas)
- **Leaflet**: Open source, sin API key, compatible con GeoJSON

## Producción

- **URL**: https://amschajari.github.io/mapa-relevamientos-municipal/
- **Deploy**: Automático con cada push a `main` via GitHub Actions

## Notas para Desarrolladores

- **Doble Ambiente**: El desarrollo se alterna entre **Oficina** (Chajarí) y **Casa**. Sincronizar siempre vía Git antes de iniciar.
- **Flujo Odoo**: Las luminarias maestras residen en Odoo.
- **RLS**: Si hay error 403 en tablas, ejecutar `ALTER TABLE tabla DISABLE ROW LEVEL SECURITY;`
- **Admin**: El usuario admin se determina por email: `a.m.saposnik@gmail.com`.
- **Mapas**: Requiere conexión a internet para OpenStreetMap tiles.
