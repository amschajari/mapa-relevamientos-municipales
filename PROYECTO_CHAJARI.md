# Proyecto: Plataforma GIS Municipal - Chajarí
## Sistema de Gestión de Activos Urbanos y Relevamiento

> **Versión:** 1.0
> **Última actualización:** 2026-03-10
> **Estado:** En desarrollo - MVP Alumbrado Público
> **Documento iterable:** Este archivo debe actualizarse con cada sprint/decisión

---

## 1. Resumen Ejecutivo

### Contexto
Proyecto para la **Municipalidad de Chajarí** que tiene como objetivo centralizar la gestión de activos urbanos, comenzando con el **relevamiento completo del alumbrado público** de la ciudad.

### Problemática Actual
- No existe un registro completo y actualizado de las luminarias de la ciudad
- La gestión de recambios, garantías y compras se realiza de forma desestructurada
- Los reportes de vecinos (vía Atención al Vecino/Odoo) no están vinculados a datos georreferenciados
- Falta visibilidad del estado real de las luminarias en campo

### Solución Propuesta
1. **App de Relevamiento** (casi lista): Para empleados de campo que registran cada luminaria con datos completos y coordenadas GPS
2. **Panel de Control GIS**: Mapa interactivo para visualizar estado, reportes y progreso del relevamiento
3. **Integración con Odoo**: Sincronización con el sistema central de la municipalidad
4. **Expansión futura**: El mismo modelo se replicará para espacios verdes, cordón cuneta, etc.

---

## 2. Entidades y Stakeholders

| Rol | Entidad | Responsabilidad |
|-----|---------|-----------------|
| **Cliente** | Municipalidad de Chajarí | Definición de requerimientos, validación, uso del sistema |
| **Área Usuario** | Alumbrado Público (y futuro: Espacios Verdes) | Operación diaria, mantenimiento |
| **Coordinador de Relevamiento** | *Usuario actual* | Planificar recorridos, controlar progreso, asegurar cobertura completa |
| **Empleados de Campo** | Personal municipal | Relevar luminarias usando app móvil |
| **Atención al Vecino** | Área de Odoo existente | Canal de reportes ciudadanos |
| **Sistema Base** | Odoo | Base de datos central, tickets, gestión de compras |

---

## 3. Stack Tecnológico

### Actual (MVP en desarrollo)
| Capa | Tecnología |
|------|------------|
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Mapas | Leaflet |
| Backend/DB | Supabase (PostgreSQL) |
| App móvil | Web App (PWA) |
| Integración | Odoo API (planificado) |

### Planificado
- **Backend adicional**: Python/Odoo para integraciones complejas
- **Sincronización**: Bidireccional Odoo ↔ GIS Platform
- **Caché offline**: Para trabajo en campo sin conectividad

---

## 4. Módulos del Sistema

### 4.1 Módulo: Relevamiento de Campo (App Móvil) ⏳ CASI LISTO
**Propósito:** Permitir a empleados registrar luminarias en campo

**Datos capturados por luminaria:**
- Coordenadas GPS (lat/long)
- Tipo de luminaria: LED / Sodio
- Dirección exacta
- Barrio
- Tipo de cableado: Aéreo / Subterráneo / No identificable
- Tipología: Tipo plaza (hasta 3m) / Tipo jirafa (+8m)
- Estado de la base: Sin base / Buen estado / Mal estado
- Número de recambios históricos
- Medidor asociado (relación)
- Fotografía (planificado)
- Observaciones

**Estado:** En pruebas, casi funcional

### 4.2 Módulo: Control de Relevamiento (Dashboard) 🆕 REQUERIDO
**Propósito:** Asistir al coordinador en el seguimiento del trabajo de campo

**Funcionalidades requeridas:**
- [ ] **Vista por barrios**: Mostrar barrios coloreados según progreso
  - Sin iniciar (gris)
  - En progreso (amarillo)
  - Completado (verde)
- [ ] **Vista por calles**: Similar granularidad a nivel calle
- [ ] **Porcentaje de cobertura**: % de luminarias relevadas vs estimadas
- [ ] **Asignación de tareas**: Asignar barrios/calles a equipos de campo
- [ ] **Validación de datos**: Marcado de luminarias "verificadas" vs "pendiente de revisión"
- [ ] **Proyección de tiempo**: Estimación de finalización según ritmo actual

### 4.3 Módulo: GIS Visualización (Existente)
**Propósito:** Mostrar luminarias en mapa con sus estados

**Actual:**
- Visualización de activos existentes
- Creación de reportes de fallas
- Panel de estadísticas

**Mejoras planificadas:**
- [ ] Filtros avanzados (por barrio, tipo, estado)
- [ ] Clustering de marcadores
- [ ] Histórico de cambios por luminaria
- [ ] Comparación antes/después (si hay fotos)

### 4.4 Módulo: Gestión de Tickets/Incidentes (Futuro)
**Propósito:** Unificar reportes de vecinos con datos de campo

**Flujo:**
1. Vecino reporta por Atención al Vecino (Odoo)
2. Sistema vincula reporte a luminaria más cercana
3. Área técnica ve prioridades en mapa
4. Se genera orden de trabajo
5. Post-reparación: técnico actualiza estado desde campo

### 4.5 Módulo: Administración (Futuro)
- Gestión de usuarios y permisos (coordinador, técnico, admin)
- Configuración de tipologías y parámetros
- Import/export de datos

---

## 5. Estructura de Datos

### 5.1 Modelo: Luminaria (ActivoAlumbrado)
```typescript
interface ActivoAlumbrado {
  id: string;                    // UUID
  id_luminaria: string;          // Código interno municipal (opcional)

  // Ubicación
  latitud: number;
  longitud: number;
  direccion: string;
  barrio: string;

  // Características técnicas
  tipo_luminaria: 'LED' | 'Sodio';
  tipo_cableado: 'Aéreo' | 'Subterráneo' | 'No se puede identificar';
  tipologia: 'Tipo plaza (hasta 3 mt.)' | 'Tipo Jirafa (+ de 8 mt.)';

  // Estado físico
  estado_base: 'Sin base' | 'Con base en buenas condiciones' | 'Con base en malas condiciones';
  estado_general: 'Funcionando' | 'Apagada' | 'Intermitente' | 'Dañada';

  // Histórico
  numero_recambios: number;
  fecha_ultimo_mantenimiento?: Date;
  observaciones: string;

  // Relaciones
  medidor_id?: string;           // Many2One con medidor
  reportes?: ReporteAlumbrado[]; // One2Many

  // Metadata
  created_at: Date;
  updated_at: Date;
  relevado_por: string;          // ID del empleado
  validado: boolean;             // Revisión del coordinador
}
```

### 5.2 Modelo: Medidor
```typescript
interface Medidor {
  id: string;
  numero_medidor: string;
  ubicacion_aprox: string;
  luminarias_asociadas: number;  // Conteo relacionado
  // Relación: One medidor → Many luminarias
}
```

### 5.3 Modelo: Reporte/Incidente
```typescript
interface ReporteAlumbrado {
  id: string;
  titulo: string;
  luminaria_id?: string;           // Vinculación a activo
  tipo_reporte: 'Falla' | 'Robo' | 'Vandalismo' | 'Solicitud' | 'Otro';
  estado_reporte: 'Nuevo' | 'En Proceso' | 'Resuelto' | 'Cancelado';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  descripcion: string;

  // Origen
  origen: 'App Campo' | 'Atención Vecino' | 'Sistema' | 'Manual';
  reportado_por?: string;          // Nombre/contacto si es vecino

  // Coordenadas (para reportes no vinculados aún)
  latitud?: number;
  longitud?: number;

  // Timeline
  created_at: Date;
  updated_at: Date;
  fecha_resolucion?: Date;
  resuelto_por?: string;
  observacion_resolucion?: string;
}
```

### 5.4 Modelo: Tarea de Relevamiento (Nuevo)
```typescript
interface TareaRelevamiento {
  id: string;
  tipo: 'Barrio' | 'Calle' | 'Zona';
  nombre: string;                // Ej: "Barrio Centro", "Calle Urquiza"

  // Estado
  estado: 'Pendiente' | 'En Progreso' | 'Completado' | 'Pausado';
  porcentaje_completado: number; // 0-100

  // Asignación
  asignado_a: string[];          // IDs de empleados

  // Métricas
  fecha_inicio?: Date;
  fecha_fin?: Date;
  luminarias_estimadas: number;
  luminarias_relevadas: number;

  // Geometría para el mapa
  poligono?: GeoJSON;            // Límites del área
  calles_incluidas?: string[];

  created_at: Date;
  updated_at: Date;
}
```

---

## 6. Integraciones

### 6.1 Odoo (Prioridad Alta)
**Datos a sincronizar:**
- [ ] Lectura: Tickets de Atención al Vecino → Reportes en GIS
- [ ] Lectura: Datos de medidores (si existen en Odoo)
- [ ] Escritura: Reportes de mantenimiento → Órdenes de trabajo en Odoo
- [ ] Escritura: Stock de recambios vinculados a luminarias

**Tecnología:** API REST de Odoo + Python script intermedio

### 6.2 Sistemas Externos (Futuro)
- APIs de proveedores de luminarias (garantías)
- Sistemas de facturación eléctrica

---

## 7. Roadmap

### Fase 1: Relevamiento (Actual - Q1 2026)
- [x] Estructura base de datos
- [x] App de relevamiento funcional
- [x] Mapa básico de visualización
- [ ] **Dashboard de control de relevamiento** ← PRÓXIMO
- [ ] Sincronización offline
- [ ] Validación de datos por coordinador

### Fase 2: Integración y Tickets (Q2 2026)
- [ ] Conector Odoo bidireccional
- [ ] Vinculación automática de reportes vecinos a luminarias
- [ ] Gestión de órdenes de trabajo
- [ ] Histórico de mantenimientos

### Fase 3: Optimización (Q3 2026)
- [ ] Analytics y reportes avanzados
- [ ] Predicción de fallas
- [ ] Optimización de rutas de mantenimiento
- [ ] App nativa (opcional)

### Fase 4: Expansión (Q4 2026+)
- [ ] Módulo de Espacios Verdes
- [ ] Módulo de Cordón Cuneta / Señalización
- [ ] API pública (para otros sistemas)

---

## 8. Referencias y Recursos

### Proyectos Base (en paralelo)
| Proyecto | Ubicación | Uso |
|----------|-----------|-----|
| `plataforma-gis-municipal` (este) | `/plataforma-gis-municipal/` | Proyecto principal |
| `reportes-urbanos-generico` | `/reportes-urbanos-generico/` | Referencia de reportes ciudadanos |
| `puerto-madryn-carteles` | `/puerto-madryn-carteles/` | Referencia de gestión de activos urbanos |

### Documentos Internos
- `Gestion de App.txt` - Notas de modelo de datos Odoo
- `database_schema.sql` - Esquema actual PostgreSQL
- `firestore_export.json` - Datos de prueba (migrando a Supabase)

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Luminaria** | Poste completo de alumbrado público con su lámpara |
| **Tipología** | Clasificación por altura: "Plaza" (baja) vs "Jirafa" (alta) |
| **Relevamiento** | Proceso de censar/recolectar datos de campo |
| **Recambio** | Reemplazo de la lámpara por una nueva |
| **Odoo** | ERP usado por la municipalidad para gestión general |

---

## 10. Decisiones Técnicas Pendientes

> Esta sección debe actualizarse con cada decisión tomada

1. **¿Cómo definir los límites de barrios/calles?**
   - Opción A: Polígonos GeoJSON importados de shapefile municipal
   - Opción B: Delimitación manual sobre mapa
   - Opción C: Calles por nombre (simpler, menos preciso)

2. **¿Cómo estimar "luminarias totales" por barrio antes de completar?**
   - Opción A: Estimación basada en extensión de calles
   - Opción B: Dato ingresado manualmente por coordinador
   - Opción C: Sin estimación, solo conteo real

3. **¿Sincronización con Odoo en tiempo real o batch?**
   - Evaluar complejidad y disponibilidad de API

---

## 11. Notas de la Última Reunión/Checkpoint

*2026-03-10:*
- Usuario coordinará recorridos de empleados calle por calle, barrio por barrio
- Necesita **mapa de calor/progreso** para ver qué zonas faltan
- El MVP de app está casi listo para empezar relevamiento
- Próximo paso: Dashboard de control para el coordinador

---

## Cómo Actualizar Este Documento

1. Agregar fecha en la línea de "Última actualización"
2. Incrementar versión si hay cambios significativos
3. Registrar decisiones en sección 10
4. Agregar notas en sección 11
5. Actualizar checkboxes de roadmap según progreso

---

*Documento generado para iteración ágil del proyecto*
