-- WooCommerce: estado de la conexion
alter table woo_tiendas add column if not exists ultima_orden_at timestamptz;
alter table woo_tiendas add column if not exists activo boolean not null default true;

-- Lola: dispositivos con licencia (demo o semestral), uno o mas por negocio.
create table if not exists lola_dispositivos (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  token text not null unique,
  nombre text not null default 'Lola',
  plan text not null default 'demo' check (plan in ('demo', 'semestral')),
  vence_at timestamptz not null,
  activo boolean not null default true,
  ultimo_contacto timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lola_dispositivos_business_idx on lola_dispositivos (business_id);

alter table lola_dispositivos enable row level security;

-- Ejemplo: dar de alta una Lola en demo de 7 dias (cambia business_id y token):
-- insert into lola_dispositivos (business_id, token, plan, vence_at)
-- values ('<business_id>', '<token-largo-aleatorio>', 'demo', now() + interval '7 days');
