create table if not exists lola_eventos (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  tipo text not null,
  titulo text not null,
  created_at timestamptz not null default now()
);

create index if not exists lola_eventos_business_id_idx
  on lola_eventos (business_id, id);

-- Solo accesible con service role (el webhook y /api/lola/eventos).
alter table lola_eventos enable row level security;
