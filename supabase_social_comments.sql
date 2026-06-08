-- Tabla para comentarios de Facebook e Instagram respondidos por el bot
CREATE TABLE IF NOT EXISTS social_comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   uuid REFERENCES businesses(id) ON DELETE CASCADE,
  platform      text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  comment_id    text NOT NULL,
  author_id     text,
  text          text NOT NULL,
  bot_reply     text,
  post_id       text,
  sent_dm       boolean DEFAULT false,
  created_at    timestamp with time zone DEFAULT now()
);

-- Evita duplicados si el webhook se dispara dos veces para el mismo comentario
CREATE UNIQUE INDEX IF NOT EXISTS social_comments_comment_id_idx ON social_comments(comment_id);

-- Índice para consultas por negocio/plataforma
CREATE INDEX IF NOT EXISTS social_comments_business_platform_idx ON social_comments(business_id, platform, created_at DESC);

-- RLS: solo acceso vía service role (el webhook usa service role)
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
