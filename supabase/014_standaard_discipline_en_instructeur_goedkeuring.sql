-- ============================================================
-- Priveles-portal Zeilschool — standaard discipline (onthouden) +
-- instructeur-goedkeuring vóór les-claim
-- Voer dit uit in de SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Standaard discipline: cursist kiest 'm vooraf, portal onthoudt 'm
--    (i.p.v. elke keer opnieuw kiezen bij het doorgeven van
--    beschikbaarheid). Null = nog niet gekozen, frontend valt dan
--    terug op 'polyvalk'.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists standaard_discipline discipline;

-- ------------------------------------------------------------
-- 2. Instructeur-goedkeuring: een instructeur mag pas een les claimen
--    (meld_aan_als_instructeur) nadat de beheerder hem heeft
--    goedgekeurd. Bestaande instructeurs blijven werkend (worden
--    hieronder meteen goedgekeurd), nieuwe promoties starten straks
--    op false (geregeld in de frontend bij het toekennen van de rol).
-- ------------------------------------------------------------
alter table public.profiles add column if not exists instructeur_goedgekeurd boolean not null default false;

update public.profiles set instructeur_goedgekeurd = true where rol = 'instructeur';

-- De bestaande update-policy op profiles staat een gebruiker toe zijn
-- eigen rij te updaten (behalve de rol, geblokkeerd door onderstaande
-- trigger). Zonder aanpassing zou een instructeur dus zichzelf via een
-- gewone update kunnen goedkeuren — daarom breiden we dezelfde trigger
-- uit zodat ook instructeur_goedgekeurd alleen door de beheerder (of de
-- SQL Editor/service role) gewijzigd mag worden.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is NULL wanneer dit via de SQL Editor / service role draait
  -- (geen ingelogde gebruiker) — alleen dan mag dit vrij wijzigen.
  if auth.uid() is not null and not public.is_beheerder() then
    if new.rol <> old.rol then
      new.rol := old.rol;
    end if;
    if new.instructeur_goedgekeurd <> old.instructeur_goedgekeurd then
      new.instructeur_goedgekeurd := old.instructeur_goedgekeurd;
    end if;
  end if;
  return new;
end;
$$;

-- meld_aan_als_instructeur: nu ook check op goedkeuring.
create or replace function public.meld_aan_als_instructeur(p_les_id uuid)
returns public.lessen
language plpgsql
security definer
set search_path = public
as $$
declare
  v_les public.lessen;
  v_goedgekeurd boolean;
begin
  if not public.is_instructeur() then
    raise exception 'Alleen instructeurs kunnen zich aanmelden voor een les';
  end if;

  select instructeur_goedgekeurd into v_goedgekeurd from public.profiles where id = auth.uid();
  if not coalesce(v_goedgekeurd, false) then
    raise exception 'Je account moet eerst door de beheerder worden goedgekeurd voordat je een les kunt claimen';
  end if;

  select * into v_les from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;
  if v_les.instructeur_id is not null then
    raise exception 'Deze les heeft al een instructeur';
  end if;
  if v_les.status <> 'gepland' then
    raise exception 'Deze les staat niet meer open';
  end if;

  update public.lessen set instructeur_id = auth.uid() where id = p_les_id
  returning * into v_les;

  return v_les;
end;
$$;
