# Mapa de Relevamientos Municipales
## Municipalidad de Chajarí - Sistema de Control de Relevamiento

> **Versión:** 1.0.0
> **Fecha:** Marzo 2026
> **Estado:** MVP Funcional

---

## Descripción

Sistema de control y seguimiento de relevamientos municipales para la Municipalidad de Chajarí. Proporciona una interfaz visual para:

- **Coordinar recorridos** de empleados de campo por barrios/calles
- **Visualizar progreso** del relevamiento en tiempo real
- **Gestionar tareas** asignadas a equipos
- **Controlar cobertura** de luminarias relevadas

**Nota importante:** Este sistema es una herramienta interna de gestión. Los datos de relevamiento reales se almacenan en el ERP Odoo de la municipalidad. Este sistema se conecta/visualiza esos datos.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Estado | Zustand (persistido en localStorage) |
| Mapas | Leaflet + React-Leaflet |
| Íconos | Lucide React |
| Fechas | date-fns |

---

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── ControlMap.tsx       # Mapa interactivo con polígonos de barrios
│   ├── BarrioPopup.tsx      # Popup de información de barrio
│   ├── BarrioDetailModal.tsx # Modal detalle de barrio
│   ├── Sidebar.tsx          # Navegación lateral
│   ├── EstadisticasPanel.tsx # Panel de estadísticas
│   └── LeyendaMapa.tsx      # Leyenda del mapa
├── pages/               # Vistas principales
│   ├── DashboardView.tsx    # Vista dashboard
│   └── BarriosView.tsx      # Lista de barrios con filtros
├── stores/              # Estado global (Zustand)
│   └── barrioStore.ts       # Store de barrios y tareas
├── types/               # Tipos TypeScript
│   └── index.ts             # Definiciones de tipos
├── data/                # Datos estáticos
│   └── barrios-chajari.json # GeoJSON de barrios
└── main.tsx            # Punto de entrada
```

---

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

La aplicación corre en `http://localhost:5173` por defecto.

---

## Funcionalidades

### 1. Dashboard
- Resumen general del estado del relevamiento
- Estadísticas de progreso
- Barrios más activos
- Indicadores de rendimiento

### 2. Mapa Interactivo
- Visualización de barrios como polígonos coloreados
- Estados: Pendiente (gris), En Progreso (naranja), Completado (verde), Pausado (rojo)
- Click en barrio para ver detalles
- Leyenda interactiva

### 3. Gestión de Barrios
- Lista completa con filtros y búsqueda
- Ordenamiento por nombre, estado, progreso
- Vista detallada de cada barrio

### 4. Persistencia
- Los datos se guardan en localStorage
- Al recargar la página se mantienen los barrios y su estado

---

## Datos

### Barrios (GeoJSON)
Los barrios se cargan desde `src/data/barrios-chajari.json`:
- 45 barrios con geometría multipolygon
- CRS: WGS84 (EPSG:4326)
- Centrado en Chajarí, Entre Ríos, Argentina (~ -30.7516, -57.9872)

**Nota:** El archivo contiene barrios incompletos. Debe actualizarse con el mapa en papel del usuario.

### Estado de Barrios
Cada barrio tiene:
- `id`: Identificador único
- `nombre`: Nombre del barrio
- `estado`: 'pendiente' | 'progreso' | 'completado' | 'pausado'
- `progreso`: Porcentaje 0-100
- `luminariasEstimadas`: Cantidad estimada
- `luminariasRelevadas`: Cantidad relevada

---

## Decisiones Técnicas Importantes

### ¿Por qué Zustand + localStorage y no Supabase?
- Este es un **sistema de control interno**
- Los datos maestros están en Odoo de la municipalidad
- Se prioriza velocidad de desarrollo y uso offline
- En el futuro puede sincronizarse con Supabase/Odoo

### ¿Por qué Leaflet y no Mapbox/Google Maps?
- Open source y gratuito
- No requiere API key
- Funciona perfectamente con GeoJSON local
- Estilo consistente con otros proyectos del usuario

### Color de barrios en el mapa
```
Pendiente:   #9ca3af (gris)
En Progreso: #f59e0b (naranja) - opacidad según progreso
Completado:  #10b981 (verde)
Pausado:     #ef4444 (rojo)
```

---

## API y Tipos

### Tipos principales (src/types/index.ts)

```typescript
interface Barrio {
  id: string
  nombre: string
  estado: 'pendiente' | 'progreso' | 'completado' | 'pausado'
  progreso: number
  luminariasEstimadas?: number
  luminariasRelevadas?: number
}

interface TareaRelevamiento {
  id: string
  tipo: 'Barrio' | 'Calle' | 'Zona'
  nombre: string
  estado: 'Pendiente' | 'En Progreso' | 'Completado' | 'Pausado'
  progreso: number
  asignadoA: string[]
  luminariasEstimadas: number
  luminariasRelevadas: number
}
```

### Store (src/stores/barrioStore.ts)

Acciones disponibles:
- `initializeFromGeoJSON(features)` - Carga barrios desde GeoJSON
- `setBarrioStatus(nombre, status)` - Cambia estado de un barrio
- `updateBarrioProgress(nombre, progress)` - Actualiza progreso
- `getBarrioByNombre(nombre)` - Obtiene barrio por nombre
- `getBarriosByEstado(estado)` - Filtra por estado

---

## Roadmap

### Fase 1 - Actual (MVP)
- [x] Mapa con barrios coloreados
- [x] Panel de estadísticas
- [x] Lista de barrios con filtros
- [x] Persistencia local

### Fase 2 - Próximo
- [ ] Conexión con Supabase para persistencia compartida
- [ ] Integración con Odoo (lectura de datos)
- [ ] Gestión de equipos y asignaciones
- [ ] Histórico de actividad

### Fase 3 - Futuro
- [ ] Sincronización offline/online
- [ ] Reportes exportables (PDF, Excel)
- [ ] API para otros sistemas
- [ ] App móvil híbrida

---

## Contexto del Proyecto

Este sistema forma parte de un proyecto mayor para la Municipalidad de Chajarí:

1. **App de Relevamiento** (casi lista): Empleados registran luminarias en campo usando Odoo
2. **Este sistema**: Dashboard de control para el coordinador (usuario actual)
3. **Futuro**: Integración completa Odoo ↔ GIS para gestión unificada

El usuario (coordinador) necesita:
- Ver qué barrios están completos/faltantes
- Asignar recorridos a equipos
- Controlar progreso del relevamiento

---

## Contacto y Notas

**Para otros desarrolladores/agentes:**
- Este proyecto usa **path aliases** (`@/*` mapea a `src/*`)
- El estado se persiste automáticamente
- Para agregar barrios, editar el GeoJSON en `src/data/`
- Los componentes usan Tailwind CSS con clases utilitarias

**Caveats:**
- El mapa usa OpenStreetMap (requiere conexión a internet)
- Los datos son locales hasta que se implemente sincronización
- Algunos barrios pueden faltar en el GeoJSON

---

## Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # ESLint
```

---

*Documento generado para facilitar el handoff entre agentes de desarrollo*
