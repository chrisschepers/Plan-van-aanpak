-- ============================================================================
-- Proefcredit-dedup — dicht de "verwijder account → opnieuw inloggen → nieuw
-- gratis credit"-lus. Draai dit ÉÉN keer in de Supabase SQL-editor, NA
-- credits.sql. Additief en veilig opnieuw uit te voeren.
--
-- Werking: bij elke nieuwe gebruiker wordt een ONOMKEERBARE sha256-hash van het
-- (kleingemaakte) e-mailadres vastgelegd. Bestaat die hash al — hetzelfde adres
-- kreeg eerder een proefcredit, ook als dat account inmiddels is verwijderd —
-- dan start het account met saldo 0 i.p.v. 1. De hash is geen leesbaar
-- persoonsgegeven-in-klare-tekst maar telt AVG-technisch wél als persoons-
-- gegeven: vermeld dit in het verwerkingsregister en de privacyverklaring
-- (grondslag: gerechtvaardigd belang, misbruikpreventie; de privacyverklaring
-- in de app is al aangepast).
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Claims-tabel: bewust GEEN foreign key naar auth.users — de claim moet een
--    account-verwijdering (cascade) juist overleven.
create table if not exists public.signup_bonus_claims (
  email_hash       text primary key,
  first_claimed_at timestamptz not null default now()
);

-- RLS aan, geen policies => anon/authenticated kunnen niets; alleen de
-- service_role/definer-functies kunnen erbij.
alter table public.signup_bonus_claims enable row level security;

-- 2. Trigger-functie vervangen: proefcredit alleen bij een nog-niet-geziene
--    e-mailhash. Zonder e-mail (hoort bij OAuth niet voor te komen) géén bonus.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare give boolean := false;
begin
  if new.email is not null and btrim(new.email) <> '' then
    begin
      insert into public.signup_bonus_claims (email_hash)
      values (encode(digest(lower(btrim(new.email)), 'sha256'), 'hex'));
      give := true;
    exception when unique_violation then
      give := false; -- dit e-mailadres kreeg al eens een proefcredit
    end;
  end if;

  insert into public.credit_balances (user_id, balance)
  values (new.id, case when give then 1 else 0 end)
  on conflict (user_id) do nothing;

  if give then
    insert into public.credit_transactions (user_id, kind, amount, balance_after)
    values (new.id, 'signup_bonus', 1, 1);
  end if;

  return new;
end;
$$;

-- (De bestaande trigger on_auth_user_created blijft staan en gebruikt nu
--  automatisch deze nieuwe functie-inhoud.)

-- 3. Backfill: hashes van alle huidige gebruikers vastleggen, zodat ook zíj
--    niet via verwijderen+opnieuw-aanmelden een tweede proefcredit krijgen.
insert into public.signup_bonus_claims (email_hash)
select encode(digest(lower(btrim(email)), 'sha256'), 'hex')
from auth.users
where email is not null and btrim(email) <> ''
on conflict (email_hash) do nothing;
