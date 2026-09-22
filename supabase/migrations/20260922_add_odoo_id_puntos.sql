-- Agregar columna odoo_id (id nativo de Odoo) como identidad estable
-- para evitar huérfanos/duplicados por rename.
-- NO destructiva: solo suma columna e índice parcial.

ALTER TABLE public.puntos_relevamiento
  ADD COLUMN IF NOT EXISTS odoo_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS puntos_relevamiento_odoo_id_unique
  ON public.puntos_relevamiento (odoo_id)
  WHERE odoo_id IS NOT NULL;

-- Verificación (debe devolver 0 filas):
-- SELECT count(*) FROM public.puntos_relevamiento
-- WHERE odoo_id IS NOT NULL GROUP BY odoo_id HAVING count(*) > 1;