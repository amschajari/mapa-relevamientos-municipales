# Documentación del Proyecto

## Descripción
Sistema de control y seguimiento de relevamientos municipales para la **Municipalidad de Chajarí**.

### Funcionalidad actual
- Mapa interactivo de barrios de Chajarí (45 barrios)
- Panel de control con estadísticas de progreso
- Gestión de estados: Pendiente → En Progreso → Completado
- Persistencia local en navegador (localStorage)

### Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Leaflet (mapas)
- Zustand (estado)
- Supabase (pendiente - no implementado aún)

---

## Archivos importantes

| Archivo | Descripción |
|---------|-------------|
| `PROYECTO_CHAJARI.md` | Documento completo del proyecto - specs, roadmap, decisiones |
| `Contexto-chat-caude.txt` | Chat original de construcción del MVP |

---

## Comandos para desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build
```

---

## Producción

- **URL:** https://amschajari.github.io/mapa-relevamientos-municipal/
- **Deploy:** Automático con cada push a `main` via GitHub Actions

---

## Siguientes pasos sugeridos

1. ✅ MVP funcional (mapa + dashboard)
2. ⏳ Integrar Supabase para datos compartidos
3. ⏳ Conectar con Odoo (API REST)
4. ⏳ Agregar más campos de relevamiento

---

*Para más detalles, ver PROYECTO_CHAJARI.md*
