-- Agregar columna `canal` a la tabla contactos
-- Valores posibles: 'whatsapp', 'instagram', 'facebook'
-- Ejecutar en Supabase SQL Editor

ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS canal text
  CHECK (canal IN ('whatsapp', 'instagram', 'facebook'));

-- Poblar canal para contactos existentes según el formato del campo `whatsapp`:
-- Los números de teléfono (solo dígitos, >8 chars) son WhatsApp.
-- Los IDs numéricos largos de Meta sin '+' pueden ser IG o FB — se deja NULL para que
-- el webhook los actualice cuando el usuario vuelva a escribir.
UPDATE contactos
SET canal = 'whatsapp'
WHERE canal IS NULL
  AND whatsapp ~ '^\d{8,15}$';
