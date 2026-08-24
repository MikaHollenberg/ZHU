-- ============================================================
-- Priveles-portal Zeilschool — instructeursrol, stap A
-- BELANGRIJK: voer dit blok als ENIGE actie uit (los van andere SQL).
-- Postgres staat niet toe dat een nieuwe enum-waarde in dezelfde
-- transactie wordt toegevoegd én gebruikt. Voer daarna pas
-- 012b_instructeur_rol.sql uit.
-- ============================================================

alter type user_role add value 'instructeur';
