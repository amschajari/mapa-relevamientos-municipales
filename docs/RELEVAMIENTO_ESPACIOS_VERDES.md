# Proyecto: Relevamiento de Espacios Verdes (Plazas, Parques y Plazoletas)

Este documento sirve como base para iterar sobre la implementación del nuevo módulo de gestión de espacios públicos.

## 1. Definición de Atributos (Modelo de Datos)

Basado en el relevamiento inicial, la tabla `espacios_verdes` (o similar) debería contener:

### Información General
- `nombre`: Texto.
- `ubicacion`: Punto geográfico (GeoJSON/PostGIS).
- `tipo`: Plaza | Plazoleta | Parque | Espacio Público (Avenidas).

### Gestión de Personal (Placero)
- `tiene_placero`: Booleano.
- `placero_nombre`: Texto (opcional).
- `placero_telefono`: Texto (opcional).

### Infraestructura y Depósito
- `tiene_deposito`: Booleano.
- **Inventario (Booleanos):** Pala, Manguera, Carretilla, Regadera, Tijera, Rastrillo, Escoba de Alambre, Escoba Común.

### Equipamiento Urbano
- `cantidad_bancos`: Entero.
- `cantidad_cestos`: Entero.
- `tiene_juegos`: Booleano.
- `tiene_gimnasio`: Booleano (cielo abierto).

### Arbolado (Relación 1:N o JSONB)
- Cada árbol requiere: Ubicación, Especie, Estado, Edad Estimada, Mantenimiento (Riego, Fertilización, Poda).

### Servicios y Mantenimiento
- `tiene_luminarias`: Booleano.
- `tiene_carteleria`: Booleano.
- **Mantenimiento Actual:** Corte de pasto, Riego.

---

## 2. Integración en el GIS

### Capas del Mapa
- Nueva capa: **"Espacios Verdes"**.
- Simbología diferenciada según el tipo (Parque vs Plazoleta).
- Al hacer clic, desplegar un **BarrioDetailModal** extendido o uno específico para Espacios Verdes.

### Dashboard de Métricas
- Cantidad total de hectáreas de espacios verdes gestionados.
- Inventario consolidado de herramientas de depósito.
- Estado general del arbolado público.

---

## 3. Próximos pasos (Para Iterar)
1. [ ] **¿Geometría?**: ¿Los espacios verdes se relevan como un **Punto** central o como un **Polígono** (similar a los barrios)?
2. [ ] **¿Arbolado?**: ¿Queremos que cada árbol sea un punto clickable en el mapa o simplemente una estadística dentro de la plaza?
3. [ ] **¿Avenidas?**: El documento menciona Av. 9 de Julio, etc. ¿Se gestionan como "Líneas" o como polígonos de canteros centrales?

> [!IMPORTANT]
> Este documento se irá actualizando a medida que definamos los detalles técnicos.
