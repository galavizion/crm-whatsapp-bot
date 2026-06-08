-- ============================================================
-- MIGRACIÓN: Habilitar RLS en todas las tablas públicas
-- Ejecutar en: Supabase > SQL Editor
-- Proyecto: Proyecto bot (spygkslsjtavglyeqzny)
--
-- Las rutas de webhook y god-mode usan service_role,
-- por lo que bypasean RLS automáticamente.
-- Las rutas autenticadas usan anon key + sesión → aplica RLS.
-- ============================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE businesses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_recibidos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Políticas para: business_users
-- Un usuario solo puede ver su propio registro.
-- Las mutaciones las hace service_role (webhook / god-mode).
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own business_users entry" ON business_users;
CREATE POLICY "Users can view their own business_users entry"
  ON business_users
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 3. Políticas para: businesses
-- Un usuario puede ver/actualizar el negocio al que pertenece.
-- ============================================================
DROP POLICY IF EXISTS "Users can view their business" ON businesses;
CREATE POLICY "Users can view their business"
  ON businesses
  FOR SELECT
  USING (
    id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update their business" ON businesses;
CREATE POLICY "Admins can update their business"
  ON businesses
  FOR UPDATE
  USING (
    id IN (
      SELECT business_id FROM business_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 4. Políticas para: contactos
-- Los usuarios ven y editan contactos de su negocio.
-- ============================================================
DROP POLICY IF EXISTS "Users can view contacts of their business" ON contactos;
CREATE POLICY "Users can view contacts of their business"
  ON contactos
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update contacts of their business" ON contactos;
CREATE POLICY "Users can update contacts of their business"
  ON contactos
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Políticas para: mensajes_recibidos
-- Solo lectura para usuarios autenticados del negocio.
-- Las escrituras las hace service_role (webhook).
-- ============================================================
DROP POLICY IF EXISTS "Users can view messages of their business" ON mensajes_recibidos;
CREATE POLICY "Users can view messages of their business"
  ON mensajes_recibidos
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Políticas para: social_accounts
-- Solo lectura para usuarios del negocio.
-- Las escrituras las hace service_role (meta/connect-pages, god-mode).
-- ============================================================
DROP POLICY IF EXISTS "Users can view social accounts of their business" ON social_accounts;
CREATE POLICY "Users can view social accounts of their business"
  ON social_accounts
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Políticas para: whatsapp_accounts
-- Solo lectura para usuarios del negocio.
-- Las escrituras las hace service_role (meta/embedded-signup, god-mode).
-- ============================================================
DROP POLICY IF EXISTS "Users can view whatsapp accounts of their business" ON whatsapp_accounts;
CREATE POLICY "Users can view whatsapp accounts of their business"
  ON whatsapp_accounts
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );
