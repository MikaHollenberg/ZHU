# Priveles-portal Zeilschool

Webportal voor priveslessen: registratie/login, beschikbaarheid doorgeven en lesplanning.
Dit is **Fase 1**: registratie/login + profielpagina + database-opzet in Supabase.

## 1. Supabase-project koppelen

1. Ga naar je Supabase-project → **Settings → API**.
2. Kopieer de **Project URL** en de **anon public key**.
3. Maak een bestand `.env.local` in de projectroot (dit bestand wordt niet gecommit):

   ```
   VITE_SUPABASE_URL=https://jouw-project.supabase.co
   VITE_SUPABASE_ANON_KEY=jouw-anon-key
   ```

## 2. Database-schema aanmaken

1. Ga in Supabase naar **SQL Editor → New query**.
2. Plak de volledige inhoud van [`supabase/schema.sql`](supabase/schema.sql) en klik **Run**.

Dit maakt de tabellen `profiles`, `beschikbaarheid`, `lessen` en `labels` aan, inclusief
Row Level Security (RLS) zodat cursisten uitsluitend hun eigen gegevens kunnen zien of
wijzigen, en een beheerder alles kan zien en beheren. Er worden ook vier standaardlabels
aangemaakt (Weinig wind, Te veel wind, Onweer, Persoonlijke redenen).

### Jezelf beheerder maken

1. Registreer eerst zelf een account via de app (`/registreren`).
2. Voer daarna dit los uit in de SQL Editor, met je eigen e-mailadres:

   ```sql
   update public.profiles set rol = 'beheerder' where email = 'jouw-email@voorbeeld.nl';
   ```

### E-mailbevestiging (optioneel uitzetten tijdens ontwikkelen)

Standaard vereist Supabase dat een nieuw account het e-mailadres bevestigt voordat
inloggen werkt. Wil je dat tijdens het testen overslaan? Zet dat uit via
**Authentication → Providers → Email → "Confirm email"**.

## 3. Project draaien

```bash
npm install
npm run dev
```

De app draait daarna op http://localhost:5173.

## 4. Privacy testen vóór livegang

Maak minimaal twee cursist-accounts aan en controleer:

- Account A kan de profielgegevens van account B niet zien of wijzigen (probeer ook
  rechtstreeks via de Supabase API-tabel, niet alleen via de schermen).
- Een cursist kan zichzelf niet tot beheerder promoveren (de database blokkeert dit
  automatisch via een trigger, maar test het na).
- De beheerder ziet wél alle cursisten.

## Volgende fasen

- **Fase 2** — Beschikbaarheidspagina voor cursisten + beheerdersdashboard (cursisten en
  beschikbaarheid bekijken, lessen inplannen).
- **Fase 3** — "Mijn lessen"-pagina + verzetten/annuleren met labels.
- **Fase 4** — E-mailnotificaties, filters/zoekfunctie, instelbare labels-lijst.
