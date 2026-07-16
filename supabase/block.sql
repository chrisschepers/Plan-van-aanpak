-- ============================================================================
-- Gebruiker blokkeren (misbruik). Draai ÉÉN keer in de Supabase SQL-editor,
-- NA credits.sql / admin.sql / promo.sql. Additief en veilig opnieuw uit te voeren.
-- Een geblokkeerd account kan niet meer verwerken, kopen of codes inwisselen.
-- ============================================================================

create table if not exists public.user_flags (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  blocked        boolean not null default false,
  blocked_reason text,
  updated_at     timestamptz not null default now()
);

-- RLS aan, geen policies => anon/authenticated kunnen niets;
-- de backend (service_role) omzeilt RLS en leest/schrijft de vlag.
alter table public.user_flags enable row level security;
