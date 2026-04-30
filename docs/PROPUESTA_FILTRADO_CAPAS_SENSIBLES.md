# Necesidad de Usuario: Filtrado de Capas Sensibles y Temporales

## 1. Contexto y Necesidad
Se requiere que ciertas capas de información (ej: **Espacios Verdes**, **Calles Pavimentadas**, **Presupuestos**) no sean visibles para el público general, sino únicamente para personal municipal autorizado y registrado.

### Perfiles de Acceso Definidos:
- **Master Admin (`a.m.saposnik@gmail.com`)**: Acceso total y derecho a manejo de edición e importación masiva de datos (GeoJSON/CSV/Odoo). Único perfil habilitado para realizar cambios estructurales en el inventario.
- **Usuario Autenticado (Personal Municipal)**: Acceso autorizado para visualizar y consultar capas operativas específicas (**Espacios Verdes** y **Calles Pavimentadas**). Sin permisos de edición.
- **Público General**: Acceso restringido únicamente a capas de información ciudadana básica.

### Requerimientos Clave:
- **Privacidad**: Las capas sensibles no deben figurar en la lista de capas si el usuario no ha iniciado sesión.
- **Seguridad**: El acceso al dato (GeoJSON/API) debe estar protegido a nivel de servidor (Supabase), no solo oculto en la interfaz.
- **Temporalidad**: Capacidad de otorgar acceso a capas específicas por un tiempo determinado (opcional/futuro).
- **Consistencia**: La nueva interfaz estilo IDE debe ser la misma para todos, pero con contenido dinámico según el perfil.

---

## 2. Plan de Implementación Propuesto

### Fase 1: Control de Interfaz (UI Logic)
- **Modificación del Store (`mapStore.ts`)**: Añadir un flag `isPrivate: boolean` a la definición de cada capa.
- **Filtrado Dinámico (`LayersPanel.tsx`)**: Integrar el estado de autenticación. Si `user === null`, filtrar el array de capas para excluir aquellas con `isPrivate: true`.
- **Resultado**: El usuario público ve un mapa "limpio" con capas básicas (Barrios, Luminarias). El operario, al loguearse, ve aparecer automáticamente las capas de gestión.

### Fase 2: Seguridad de Datos (Backend RLS)
- **Políticas de Supabase**: Configurar Row Level Security (RLS) en las tablas sensibles.
- **Regla**: `SELECT` permitido solo para `role = authenticated`.
- **Resultado**: Aunque un usuario avanzado intente llamar a la API de Supabase manualmente, el servidor rechazará la petición si no hay una sesión activa.

### Fase 3: Acceso Temporal (Metadata-driven)
- **Metadatos de Usuario**: Utilizar el campo `user_metadata` de Supabase Auth para almacenar permisos específicos.
- **Atributo**: `authorized_layers: { layer_id: string, expires_at: timestamp }`.
- **Lógica**: El frontend valida no solo si el usuario está logueado, sino si su permiso para esa capa específica sigue vigente.

---

## 3. Impacto en el Proyecto
Este plan permite realizar el **Merge a `main`** de la nueva interfaz IDE de forma segura. La estructura del sitio se moderniza para todos, pero el contenido sensible queda resguardado bajo el sistema de autenticación ya existente.

---

**Preparado por:** Antigravity AI
**Fecha:** 29/04/2026
**Estado:** Propuesta para Validación
