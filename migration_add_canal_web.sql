-- Agregar 'web' como canal válido en la tabla contactos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE contactos
  DROP CONSTRAINT IF EXISTS contactos_canal_check;

ALTER TABLE contactos
  ADD CONSTRAINT contactos_canal_check
  CHECK (canal IN ('whatsapp', 'instagram', 'facebook', 'web'));
