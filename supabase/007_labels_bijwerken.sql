-- ============================================================
-- Priveles-portal Zeilschool — labels bijwerken
-- Nieuwe standaardlijst: Te weinig wind, Teveel wind, Onweer, Ziekte, Overig.
-- Idempotent: hernoemt bestaande labels in plaats van te verwijderen, zodat
-- eventuele koppelingen vanuit lessen intact blijven.
-- ============================================================

update public.labels set naam = 'Te weinig wind' where naam = 'Weinig wind';
update public.labels set naam = 'Teveel wind' where naam = 'Te veel wind';

delete from public.labels
where naam = 'Persoonlijke redenen'
  and id not in (select label_id from public.lessen where label_id is not null);

insert into public.labels (naam, type)
select v.naam, v.type::label_type
from (values ('Ziekte', 'beide'), ('Overig', 'beide')) as v(naam, type)
where not exists (select 1 from public.labels l where l.naam = v.naam);
