-- ============================================================================
-- Actie-/promocodes — voor o.a. de LinkedIn-actie ("reageer → gratis credit").
-- Draai dit ÉÉN keer in de Supabase SQL-editor, NA credits.sql en admin.sql.
-- Additief en veilig opnieuw uit te voeren.
-- ============================================================================

-- 1. TABELLEN -----------------------------------------------------------------
create table if not exists public.promo_codes (
  code            text primary key,            -- altijd hoofdletters opgeslagen
  credits         integer not null check (credits > 0),
  max_redemptions integer,                      -- null = ongelimiteerd
  redeemed_count  integer not null default 0,
  expires_at      timestamptz,                  -- null = verloopt niet
  active          boolean not null default true,
  note            text,
  created_at      timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id         bigint generated always as identity primary key,
  code       text not null references public.promo_codes(code) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (code, user_id)                        -- 1× inwisselen per account per code
);

-- 2. RLS: geen policies => anon/authenticated kunnen niets; service_role omzeilt.
alter table public.promo_codes       enable row level security;
alter table public.promo_redemptions enable row level security;

-- 3. RPC: code inwisselen. Veilig (geen exception naar de client) — geeft een
--    jsonb terug met ok/reason. Alleen de service_role mag aanroepen.
create or replace function public.rpc_redeem_promo(p_user uuid, p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare c public.promo_codes; new_balance integer; n text;
begin
  n := upper(btrim(p_code));
  select * into c from public.promo_codes where code = n for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'onbekend'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'inactief'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('ok', false, 'reason', 'verlopen'); end if;
  if c.max_redemptions is not null and c.redeemed_count >= c.max_redemptions then return jsonb_build_object('ok', false, 'reason', 'uitgeput'); end if;
  if exists (select 1 from public.promo_redemptions r where r.code = n and r.user_id = p_user) then
    return jsonb_build_object('ok', false, 'reason', 'al_gebruikt');
  end if;

  insert into public.promo_redemptions (code, user_id) values (n, p_user);
  update public.promo_codes set redeemed_count = redeemed_count + 1 where code = n;

  insert into public.credit_balances (user_id, balance)
  values (p_user, c.credits)
  on conflict (user_id) do update set balance = credit_balances.balance + c.credits, updated_at = now()
  returning balance into new_balance;

  insert into public.credit_transactions (user_id, kind, amount, balance_after, note)
  values (p_user, 'bonus', c.credits, new_balance, 'Actiecode: ' || n);

  return jsonb_build_object('ok', true, 'credits', c.credits, 'balance', new_balance);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'reason', 'al_gebruikt');
end;
$$;

revoke execute on function public.rpc_redeem_promo(uuid,text) from public, anon, authenticated;
grant  execute on function public.rpc_redeem_promo(uuid,text) to service_role;
