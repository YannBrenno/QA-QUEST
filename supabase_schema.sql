-- ==========================================================
-- QA QUEST — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ==========================================================

-- ---- Tabela principal ----
create table if not exists players_online (
  id           text primary key,
  nickname     text not null,
  color        text not null default '#00e5ff',
  accessory    text not null default 'none',
  x            float8 not null default 200,
  y            float8 not null default 200,
  direction    float8 not null default 0,
  "currentArea" text not null default 'lobby',
  "lastSeen"   timestamptz not null default now()
);

-- ---- Indexes ----
create index if not exists idx_players_area on players_online("currentArea");
create index if not exists idx_players_seen on players_online("lastSeen");

-- ---- Row Level Security ----
alter table players_online enable row level security;

drop policy if exists "Leitura pública"    on players_online;
drop policy if exists "Inserção pública"   on players_online;
drop policy if exists "Atualização pública" on players_online;
drop policy if exists "Deleção pública"    on players_online;

create policy "Leitura pública" on players_online
  for select using (true);

create policy "Inserção pública" on players_online
  for insert with check (true);

create policy "Atualização pública" on players_online
  for update using (true) with check (true);

create policy "Deleção pública" on players_online
  for delete using (true);

-- ---- Realtime ----
-- OBRIGATÓRIO para jogadores se verem em tempo real!
-- Execute esta linha separadamente se necessário:
alter publication supabase_realtime add table players_online;

-- ---- Cleanup function (opcional, para rodar via pg_cron) ----
create or replace function cleanup_ghost_players()
returns void language plpgsql as $$
begin
  delete from players_online
  where "lastSeen" < now() - interval '10 minutes';
end;
$$;

-- Para agendar limpeza automática (requer pg_cron):
-- select cron.schedule('cleanup-ghosts', '*/5 * * * *', 'select cleanup_ghost_players()');
