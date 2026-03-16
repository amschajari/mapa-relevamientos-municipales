# PROMPT DE ANÁLISIS ESTRATÉGICO: GIS + ODOO (CHAJARÍ)
**Destinatario:** IA Experta en Arquitectura de Sistemas y Gestión Pública.
**Objetivo:** Evaluar la integración táctica entre un sistema GIS (hoja de ruta) y Odoo (sistema maestro) para un relevamiento de alumbrado público.

---

## 1. CONTEXTO DEL PROYECTO
- **Misión:** Digitalizar y optimizar el relevamiento de activos de alumbrado en la ciudad de Chajarí.
- **Equipo de Campo:** 2 personas (operarios).
- **Régimen:** Horas extras vespertinas (3-4 horas de luz/jornada).
- **Herramientas Actuales:** 
    - **Odoo:** Sistema oficial de registro (Master Data).
    - **GIS Propio (React/Supabase/Leaflet):** Dashboard estratégico y visualizador de capas.
    - **App MVP (Firestore):** Herramienta complementaria de alta precisión para descubrimiento.

## 2. EL DILEMA DEL "HUECO ESTRATÉGICO"
El municipio sufre de falta de "quórum" institucional si se duplican las cargas de datos. Odoo es obligatorio, pero es un sistema **tabular (ciego al espacio)**. Registra que se cargó una luz, pero no advierte que se saltaron tres calles.

**Rol Definido para el GIS:** No es un recolector de datos *oficial*, es un **Orquestador Táctico** y **Auditor de Cobertura**.

## 3. COMPONENTES DE LA ESTRATEGIA PROPUESTA
### A. El GIS como Orquestador (Pre-Task)
- Segmentación de barrios en "Misiones de 3 Horas".
- Priorización basada en reclamos previos (Mapa de calor de tickets).
- Definición de rutas óptimas para los 2 agentes.

### B. El GIS como Auditor (Post-Task)
- **Cruce de Datos:** El GIS importa los puntos registrados en Odoo y los proyecta sobre la trama urbana.
- **Detección de "Gaps":** Generación de polígonos de "calle no recorrida".
- **Validación de Inventario:** Comparación entre lo que el operario dice que hay vs. la densidad teórica de postes.

### C. El GIS como Tablero de Gestión (Reporting Político)
- **Audiencia:** Autoridades de área e Intendente Municipal.
- **Función:** Visualización panorámica de avance vs. proyección. Justificación de inversión y tiempos de respuesta.
- **Gratificación Visual:** Transformar la carga administrativa de Odoo en un mapa de "territorio conquistado" y "metas cumplidas".

---

## 4. REQUERIMIENTO PARA LA IA EXPERTA
Analiza este escenario y responde a los siguientes puntos de fricción:

1. **Acople de Baja Fricción:** ¿Cómo evitamos que el operario sienta que trabajar para Odoo mientras mira el GIS es una carga doble? ¿Es viable una integración "silenciosa"?
2. **Métricas de Éxito:** Más allá de "Número de luces", ¿qué métricas geográficas (ej: % de manzanas auditadas) darían mayor valor político y operativo al coordinador?
3. **Manejo de Inconsistencias:** Si el operario carga un dato en Odoo que el GIS detecta como improbable geográficamente (ej: luz en medio de un campo), ¿cómo debe ser el flujo de corrección?
4. **Resistencia al Cambio:** ¿Cómo vendemos a los "ideólogos" que el GIS no es una "herramienta más", sino el visor que garantiza que la inversión en Odoo sea real y completa?

---

- Base de datos Supabase con PostGIS activa.
- Capas de barrios GeoJSON (45 barrios) con auditoría de superficie automática.
- Gestión de puntos: Capa de Descubrimiento (azul) y Capa Oficial (amarilla con clusters animados).
- Proceso de "Oficialización": Bulk upload de GeoJSON a DB relacional con RLS activado.
- Limpieza: Herramienta de Reinicio masivo por barrio para transición a modo producción.
