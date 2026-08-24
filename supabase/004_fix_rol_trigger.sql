-- ============================================================
-- Priveles-portal Zeilschool — bugfix
-- De trigger die zelf-promotie tot beheerder voorkomt, blokkeerde per
-- ongeluk ook updates via de SQL Editor (daar is auth.uid() NULL,
-- waardoor is_beheerder() altijd false leek). Voer dit uit in de SQL
-- Editor, en probeer daarna opnieuw jezelf beheerder te maken.
-- ============================================================

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol <> old.rol and auth.uid() is not null and not public.is_beheerder() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;
