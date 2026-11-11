-- Tiendas WooCommerce por negocio (multi-tenant).
-- woo_token va en la URL del webhook; woo_secret es el "Secret" configurado en WooCommerce.
create table if not exists woo_tiendas (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  woo_token text not null unique,
  woo_secret text not null,
  created_at timestamptz not null default now()
);

create index if not exists woo_tiendas_business_id_idx on woo_tiendas (business_id);

alter table woo_tiendas enable row level security;

-- Referencia externa para deduplicar eventos (ej. 'woo:1234').
-- Los eventos existentes quedan con ref null (los nulls no chocan entre si).
alter table lola_eventos add column if not exists ref text;

create unique index if not exists lola_eventos_business_ref_uidx
  on lola_eventos (business_id, ref);

-- Ejemplo para dar de alta una tienda (cambia los valores):
-- insert into woo_tiendas (business_id, woo_token, woo_secret)
-- values ('a2ec2bbf-b452-4618-9dc6-6e4f15de6523', '<token-largo-aleatorio>', '<secret-largo-aleatorio>');
