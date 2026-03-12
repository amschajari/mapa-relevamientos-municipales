---
description: Proceso de revisión de código enfocado en seguridad, performance y estándares.
---

1.  **Seguridad**:
    - ¿Se modificaron tablas en Supabase? Verificar si requieren aplicar RLS.
    - ¿Se están exponiendo secretos o credenciales?
2.  **Performance (Leaflet)**:
    - ¿Se están cargando demasiados puntos sin clustering o canvas?
    - ¿Hay re-renders innecesarios en `MapContainer`?
3.  **Calidad**:
    - ¿Cumple con `DEVELOPMENT.md`?
    - ¿Están los tipos de TypeScript correctamente definidos?
// turbo
4.  **Pruebas**: Ejecutar `npm test` para asegurar que nada se rompió.
