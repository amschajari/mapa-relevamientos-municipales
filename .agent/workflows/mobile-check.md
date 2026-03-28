---
description: Protocolo de validación de UI/UX para asegurar una experiencia táctil fluida en relevamientos de campo.
---

Este workflow asegura que cualquier cambio en Marcadores, Clustering o Leyendas mantenga los estándares de usabilidad móvil necesarios para el trabajo municipal en calle.

1.  **Interactividad Táctil**:
    - [ ] ¿Los botones de control (GPS, Capas, Menú) tienen al menos 44x44px?
    - [ ] ¿Es fácil tocar un marcador individual cuando el mapa está al zoom máximo (18)?
2.  **Visualización**:
    - [ ] ¿El `luminaria-popup` se ve completo sin necesidad de scroll horizontal en un ancho de 360px?
    - [ ] ¿La leyenda compacta es legible y no obstruye el botón de GPS?
3.  **Lógica de Mapa**:
    - [ ] ¿El clustering se desactiva correctamente en zoom 18?
    - [ ] ¿El Mapa de Calor (Heatmap) responde fluido a gestos de "pinch-to-zoom"?
4.  **Ubicación**:
    - [ ] ¿El marcador de `UserLocationMarker` (GPS) es claro frente al fondo satelital?

// turbo
5.  **Validación de Performance**: Ejecutar `npm run build` para asegurar que el bundle final no sea excesivamente pesado para conexiones 4G/LTE de campo.
