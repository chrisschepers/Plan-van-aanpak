-- ============================================================================
-- Adminlaag — beheer van credits voor planvanaanpakinvuller.nl
-- Draai dit ÉÉN keer in de Supabase SQL-editor, NA credits.sql.
-- Additief en veilig opnieuw uit te voeren.
-- ============================================================================

-- 1. 'admin' (en 'bonus' voor later) toestaan als transactie-soort.
alter table public.credit_transactions drop constraint if exists credit_transactions_kind_check;
alter table public.credit_transactions add constraint credit_transactions_kind_check
  check (kind in ('signup_bonus','purchase','consume','refund','admin','bonus'));

-- 2. Reden/notitie bij een (admin)mutatie — voor de audit.
alter table public.credit_transactions add column if not exists note text;

-- 3. RPC: admin past het saldo aan (+/-), nooit < 0, met audit-regel.
--    Alleen de service_role mag dit aanroepen (de frontend dus niet).
create or replace function public.rpc_admin_adjust(p_user uuid, p_amount integer, p_note text)
returns integer
language plpgsql security definer set search_path = public
as $$
declare new_balance integer;
begin
  insert into public.credit_balances (user_id, balance)
  values (p_user, greatest(0, p_amount))
  on conflict (user_id) do update
    set balance = greatest(0, credit_balances.balance + p_amount), updated_at = now()
  returning balance into new_balance;

  insert into public.credit_transactions (user_id, kind, amount, balance_after, note)
  values (p_user, 'admin', p_amount, new_balance, p_note);

  return new_balance;
end;
$$;

revoke execute on function public.rpc_admin_adjust(uuid,integer,text) from public, anon, authenticated;
grant  execute on function public.rpc_admin_adjust(uuid,integer,text) to service_role;
