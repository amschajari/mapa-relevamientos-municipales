# Checklist de comercialización del visor

Pasos mínimos antes de ofrecer/vender la herramienta a terceros.

## 1. Propiedad intelectual
- [ ] Pasar el repo a **privado** (o migrar de host) — hoy es público.
- [ ] Agregar `LICENSE` propietaria (todos los derechos reservados / licencia comercial).
- [ ] Revisar que no haya código de terceros con licencia copyleft pegado sin declarar
      (`package.json` es MIT/ISC en general — verificar).

## 2. Secretos y datos
- [ ] Sacar `.env.local` del repo (`git rm --cached`, agregar a `.gitignore`).
- [ ] Rotar las keys expuestas (la anon key de Supabase ya quedó en el historial).
- [ ] Quitar/anonimizar datos reales del municipio (CSV de Odoo, emails, coordenadas
      de producción) o moverlos fuera del repo.
- [ ] Revisar Edge Functions y `supabase/` por credenciales hardcodeadas.

## 3. Producto instalable
- [ ] `README` de instalación para terceros (requisitos, env, deploy).
- [ ] Variables de entorno documentadas (plantilla `.env.example`).
- [ ] Definir qué es configurable por cliente (nombre municipio, barrios, basemap).

## 4. Costos a presupuestar
- [ ] Hosting app (Vercel Pro o alternativa) — el free no cubre uso comercial.
- [ ] Supabase (plan según filas/transferencia) + backups.
- [ ] Dominio + mail transaccional si aplica.

## 5. Operación
- [ ] `reconcile-odoo` programado (cron/CI) como monitoreo de sync.
- [ ] Definir SLA y canal de soporte.
