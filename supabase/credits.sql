-- ============================================================================
-- Creditsysteem — datalaag voor planvanaanpakinvuller.nl
-- Draai dit ÉÉN keer in de Supabase SQL-editor (project: oetlbnxpwthsuwrpwylq).
-- Schema: public. Veilig opnieuw uit te voeren (idempotent waar mogelijk).
-- ============================================================================

-- 1. TABELLEN -----------------------------------------------------------------

-- Saldo per gebruiker (1 rij per auth-gebruiker).
create table if not exists public.credit_balances (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  balance    integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- Transactie-/betalingshistorie (idempotentie + audit).
create table if not exists public.credit_transactions (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('signup_bonus','purchase','consume','refund')),
  amount            integer not null,          -- + bijschrijven, - verbruik
  balance_after     integer,
  mollie_payment_id text,
  bundle            text,
  amount_cents      integer,
  status            text,
  created_at        timestamptz not null default now()
);

-- Idempotentie: elke Mollie-betaling wordt hoogstens één keer als 'purchase' verzilverd.
create unique index if not exists uq_tx_mollie_paid
  on public.credit_transactions (mollie_payment_id)
  where kind = 'purchase';

create index if not exists ix_tx_user_created
  on public.credit_transactions (user_id, created_at desc);

-- 2. ROW LEVEL SECURITY -------------------------------------------------------
-- Gebruiker mag alleen eigen rijen LEZEN. Geen schrijf-policy => de frontend
-- (anon/authenticated) kan niets muteren. De service_role (backend) omzeilt RLS.

alter table public.credit_balances     enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "saldo: eigen rij lezen" on public.credit_balances;
create policy "saldo: eigen rij lezen"
  on public.credit_balances for select
  using (auth.uid() = user_id);

drop policy if exists "transacties: eigen rijen lezen" on public.credit_transactions;
create policy "transacties: eigen rijen lezen"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- 3. GRATIS PROEFCREDIT BIJ NIEUWE GEBRUIKER ---------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_balances (user_id, balance)
  values (new.id, 1)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, kind, amount, balance_after)
  values (new.id, 'signup_bonus', 1, 1);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Eenmalige backfill: bestaande accounts krijgen ook 1 gratis credit.
insert into public.credit_balances (user_id, balance)
select id, 1 from auth.users
on conflict (user_id) do nothing;

insert into public.credit_transactions (user_id, kind, amount, balance_after)
select id, 'signup_bonus', 1, 1 from auth.users u
where not exists (
  select 1 from public.credit_transactions t
  where t.user_id = u.id and t.kind = 'signup_bonus'
);

-- 4. RPC'S (security definer; alleen de service_role mag ze aanroepen) --------

-- Verbruik 1 credit. Atomair (nooit < 0). NULL = onvoldoende saldo.
create or replace function public.rpc_consume_credit(p_user uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare new_balance integer;
begin
  update public.credit_balances
     set balance = balance - 1, updated_at = now()
   where user_id = p_user and balance > 0
   returning balance into new_balance;
  if new_balance is null then return null; end if;
  insert into public.credit_transactions (user_id, kind, amount, balance_after)
  values (p_user, 'consume', -1, new_balance);
  return new_balance;
end;
$$;

-- Boek 1 credit terug (na mislukte/geweigerde verwerking).
create or replace function public.rpc_refund_credit(p_user uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare new_balance integer;
begin
  update public.credit_balances
     set balance = balance + 1, updated_at = now()
   where user_id = p_user
   returning balance into new_balance;
  insert into public.credit_transactions (user_id, kind, amount, balance_after)
  values (p_user, 'refund', 1, new_balance);
  return new_balance;
end;
$$;

-- Schrijf credits bij na een geslaagde betaling. IDEMPOTENT op payment-id.
create or replace function public.rpc_add_credits(
  p_user uuid, p_amount integer, p_payment_id text, p_bundle text, p_amount_cents integer
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare new_balance integer; already boolean;
begin
  select exists(
    select 1 from public.credit_transactions
    where mollie_payment_id = p_payment_id and kind = 'purchase'
  ) into already;
  if already then
    select balance into new_balance from public.credit_balances where user_id = p_user;
    return new_balance;
  end if;

  insert into public.credit_balances (user_id, balance)
  values (p_user, p_amount)
  on conflict (user_id) do update set balance = credit_balances.balance + p_amount, updated_at = now()
  returning balance into new_balance;

  insert into public.credit_transactions
    (user_id, kind, amount, balance_after, mollie_payment_id, bundle, amount_cents, status)
  values (p_user, 'purchase', p_amount, new_balance, p_payment_id, p_bundle, p_amount_cents, 'paid');

  return new_balance;
exception when unique_violation then
  select balance into new_balance from public.credit_balances where user_id = p_user;
  return new_balance;
end;
$$;

-- Alleen de service_role mag muteren (frontend dus niet).
revoke execute on function public.rpc_consume_credit(uuid)                              from public, anon, authenticated;
revoke execute on function public.rpc_refund_credit(uuid)                               from public, anon, authenticated;
revoke execute on function public.rpc_add_credits(uuid,integer,text,text,integer)       from public, anon, authenticated;
grant  execute on function public.rpc_consume_credit(uuid)                              to service_role;
grant  execute on function public.rpc_refund_credit(uuid)                               to service_role;
grant  execute on function public.rpc_add_credits(uuid,integer,text,text,integer)       to service_role;
