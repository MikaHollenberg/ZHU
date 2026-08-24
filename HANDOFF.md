# Overdracht — Priveles-portal Zeilschool Het Uitgeestermeer

Lees dit bestand als eerste in een nieuwe sessie om snel weer op snelheid te zijn.

## Wat is dit

Een webportal voor priveslessen van Zeilschool Het Uitgeestermeer. Cursisten geven
beschikbaarheid door, de beheerder plant lessen in, instructeurs kunnen lessen
geven. React + Vite + TypeScript + Tailwind, met Supabase (Postgres + Auth + Row
Level Security) als backend. Geen aparte server — alles draait via Supabase's API
rechtstreeks vanuit de browser.

## Locatie & links

- **Project directory**: `/Volumes/Expansion/ZHUPortal Claude`
- **Live site**: https://zhuportal.vercel.app (Vercel, auto-deploy vanaf `main`)
- **GitHub**: https://github.com/MikaHollenberg/ZHU
- **Supabase project**: `azdjqqbnexwnhcvbhxoq` (URL/key staan in `.env.local`, niet
  gecommit — zie `.env.example` voor het formaat)

## Tech-details om te weten

- **Git push werkt niet via de CLI** in deze sessie — er is geen credential helper
  ingesteld en de gebruiker wil geen tokens delen (terecht, dat is ook tegen de
  regels). De gebruiker pusht zelf via **GitHub Desktop**: hij opent de app, ziet
  de nieuwe commit(s), klikt "Push origin". Vraag dit gewoon als er gepusht moet
  worden — leg niet opnieuw uit hoe GitHub Desktop werkt tenzij nodig.
- **Vercel deployt automatisch** bij elke push naar `main`. Er staat een
  `vercel.json` met een rewrite-regel (nodig voor client-side routing met React
  Router — zonder dat geeft elke pagina behalve `/` een 404 bij verversen).
- **Dev-server**: `npm run dev` (Vite, poort 5173). Er is een `.claude/launch.json`
  voor de `preview_start`-tool, maar op dit exFAT/netwerkvolume gaf die tool soms
  EPERM-fouten bij het opstarten. Werkende fallback: start de server handmatig op
  de achtergrond via Bash:
  ```bash
  cd "/Volumes/Expansion/ZHUPortal Claude" && npm run dev > /tmp/vite-dev.log 2>&1 &
  disown
  ```
  Check daarna `lsof -ti:5173` om te zien of hij al draait voor je een nieuwe start.
- **Browser-pane sessie-verwarring**: de Claude Browser-pane (tool `seed`-tab) is
  een ANDER browservenster dan de eigen browser van de gebruiker. Als je vraagt om
  in te loggen, wees expliciet of je bedoelt "log in in het venster dat ik hier
  bestuur" — anders logt de gebruiker in bij zichzelf en zie jij niets.
- **Geen `gh` CLI en geen node/npm** stonden bij aanvang van het project op deze
  Mac — beide zijn inmiddels via Homebrew geïnstalleerd (`brew install node`).
- macOS maakt `._*`-bestanden aan op dit netwerkvolume (AppleDouble). Die staan in
  `.gitignore`, negeer ze.

## Database — belangrijk

`supabase/schema.sql` is de **consoliderende, actuele versie** van het hele
schema (bruikbaar voor een verse installatie in één keer). De losse,
doorgenummerde bestanden in `supabase/*.sql` zijn de migraties zoals ze
daadwerkelijk zijn uitgevoerd op het live Supabase-project, in deze volgorde:

```
002_beschikbaarheid_en_inplannen.sql
003_beschikbaarheid_per_dag.sql
004_fix_rol_trigger.sql
005_rooster_verzetten_annuleren.sql
006_minimale_lesduur.sql
007_labels_bijwerken.sql
008_minimale_lesduur_lessen.sql
009_archiveren_cursisten.sql
010_duo_cursus.sql
011_tweede_persoon_hergebruiken.sql
012a_instructeur_rol_enum.sql   ← moet als LOSSE actie draaien (enum ADD VALUE)
012b_instructeur_rol.sql        ← daarna pas dit
012c_verzet_les_instructeur_fix.sql
013_disciplines.sql
```

(Fase 1's basis-schema, vóór deze lijst, staat direct in `schema.sql` zelf.)

**Alles hierboven is al uitgevoerd op het live Supabase-project.** Als je nieuwe
databasewijzigingen maakt: voeg een nieuw doorgenummerd bestand toe (`014_...`),
werk `schema.sql` ook bij (voor een verse installatie), en laat de gebruiker het
in de Supabase SQL Editor draaien — plak de inhoud altijd ook direct in de chat
(niet alleen "voer dit bestand uit"), de gebruiker kopieert liever rechtstreeks.

Let op de `alter type ... add value` valkuil: een nieuwe enum-waarde toevoegen
moet in een aparte transactie/los "Run"-moment vóórdat je hem in dezelfde script
gebruikt (zie hoe 012a/012b zijn gesplitst).

## Datamodel (kern)

- `profiles` — 1-op-1 met `auth.users`. `rol`: `cursist` | `beheerder` |
  `instructeur`. `gearchiveerd` boolean. Rol-wijziging alleen door beheerder
  (trigger `prevent_role_escalation`, checkt `auth.uid() is not null` zodat de
  SQL Editor zelf niet geblokkeerd wordt).
- `beschikbaarheid` — cursist/instructeur geeft hele dag beschikbaar/onbeschikbaar
  of een tijdvak door (min. 2 uur). Ook `soort` (privéles/duo_cursus, alleen
  relevant voor cursisten) en `discipline` (polyvalk/fox22/windsurf) staan hier al
  op, en worden overgenomen naar de les zodra ingepland.
- `lessen` — de daadwerkelijk ingeplande les. `status`: gepland/verzet/
  geannuleerd. `instructeur_id` (nullable). Alle mutaties lopen via RPC's
  (`plan_les`, `verzet_les`, `annuleer_les`, `meld_aan_als_instructeur`,
  `meld_af_als_instructeur`) — nooit rechtstreeks een `update` vanuit de
  frontend, behalve voor instructeur-koppeling en discipline-wijziging door de
  beheerder (die mag alles via de gewone RLS-policy).
- `tweede_persoon` — vaste duo-partner per cursist (uniek op `boeker_id`, dus
  altijd upserten met `onConflict: 'boeker_id'`, nooit los inserten).
- `labels` — redenen voor verzetten/annuleren, door beheerder zelf beheerbaar.

RLS-privacy is grondig getest: cursisten zien nooit elkaars gegevens,
instructeurs zien alleen namen van cursisten waar ze een les mee hebben (via de
RPC `lesgever_mijn_cursisten`, nooit brede profieltoegang), en niemand kan
zichzelf een hogere rol geven.

## Wat is al gebouwd (functioneel)

**Fase 1** — registratie/login, profielbeheer.
**Fase 2** — beschikbaarheid doorgeven (weekkalender-UI), beheerdersrooster met
inplannen.
**Fase 3** — "Mijn lessen" (cursist), verzetten/annuleren met labels.
**Fase 4** — zoekfunctie cursisten, zelf beheerbare labels.
**Extra, op verzoek van de gebruiker**:
- Cursisten archiveren (portaltoegang volledig geblokkeerd, ook op API-niveau).
- Duo-cursus (2 personen per les) met een vaste, hergebruikte duo-partner per
  cursist — nooit opnieuw hoeven invullen. Beheerder kan de partnergegevens
  bekijken en loskoppelen.
- Instructeursrol: eigen beschikbaarheid, zelfaanmelding voor lessen,
  beheerderskoppeling, eigen "Lesgeven"-overzicht.
- Disciplines (Polyvalk/Fox22/Windsurf) met kleurcodering + tekstlabel, overal
  consistent (centrale config in `src/lib/disciplines.ts` + Tailwind-theme-tokens
  in `src/index.css`).
- Beheerdersrooster gesplitst in aparte tabellen voor cursisten en instructeurs.
- Huisstijl: logo's van Zeilschool Het Uitgeestermeer (transparant gemaakt,
  origineel stond in `logo's/`), kleurenschema afgeleid van de echte website.
- Responsive: mobiel hamburgermenu, containerbreedte vergroot zodat tabellen op
  desktop niet meer hoeven te scrollen.

## Belangrijke gedragsafspraken met de gebruiker (uit dit gesprek)

- De gebruiker (Mika Hollenberg) is zelf de beheerder van de zeilschool, niet per
  se technisch onderlegd — leg SQL-stappen expliciet uit, plak altijd de volledige
  query in de chat.
- Werk instructies uit met echte browsertests (niet alleen `tsc`/`lint`), en meld
  concrete bevindingen — er zijn onderweg meerdere echte bugs gevonden door
  daadwerkelijk te testen (bijv. instructeur_id die verloren ging bij verzetten,
  een naamlek via een cursist_id-lookup). Blijf dat testritme aanhouden.
- Voor kleurwensen ("babyblauw", "subtiel maar aanwezig" voor het logo): de
  gebruiker geeft vaak losse, informele bijsturingen tijdens het werk — reageer
  daar direct op, ook als je middenin iets anders zit.
- Nooit zelf pushen/deployen zonder het aan de gebruiker te vragen; git-acties
  zijn prima om te doen, maar leg uit wat je gaat doen.

## Testaccounts (allemaal in het live Supabase-project)

| Rol | E-mail | Wachtwoord |
|---|---|---|
| Cursist | hollenbergmika+cursista@gmail.com | TestWachtwoord123 |
| Instructeur (was cursist A, omgezet) | zelfde account als hierboven | zelfde |
| Cursist | hollenbergmika+cursistb@gmail.com | (nooit succesvol bevestigd, niet bruikbaar) |
| Cursist | hollenbergmika+cursistb2@gmail.com | TestWachtwoord789 |
| Beheerder | hollenbergmika@gmail.com (echt account van de gebruiker) | onbekend bij Claude, gebruiker logt zelf in |

`hollenbergmika+cursista@gmail.com` is via het beheerdersdashboard omgezet naar
**instructeur** tijdens het testen van onderdeel 1 — die is dus nu geschikt om
instructeur-functionaliteit mee te testen, niet meer om als cursist te testen.

## Wat nog open staat / mogelijke vervolgstappen

- **E-mailnotificaties** — bewust overgeslagen (Fase 4, optioneel), gebruiker
  wilde eerst geen externe e-maildienst kiezen. Vraag opnieuw als het weer
  ter sprake komt.
- De instructeur-tabel in het rooster (onderdeel 3) laat de beheerder nog niet
  toe om een lesgever te koppelen aan een cel die nog GEEN les heeft (alleen aan
  bestaande lessen). Zou een logische uitbreiding zijn als de gebruiker vraagt om
  vanuit de instructeur-tabel ook direct te kunnen inplannen.
- Geen geautomatiseerde tests (unit/e2e) — alles is tot nu toe handmatig getest via
  de browser tijdens elke sessie. Overweeg dit te bespreken als het project groter
  wordt.
- Laatste commit (`60f0572`) staat **lokaal klaar maar is nog niet gepusht** naar
  GitHub — vraag de gebruiker om dit via GitHub Desktop te doen zodra hij verder
  wil, of doe het zelf als er alsnog een werkende `git push` beschikbaar is.

## Snel starten in een nieuwe sessie

```bash
cd "/Volumes/Expansion/ZHUPortal Claude"
lsof -ti:5173 || (npm run dev > /tmp/vite-dev.log 2>&1 & disown)
```

Open daarna `http://localhost:5173` in de Browser-pane, of vraag de gebruiker
naar zijn eigen inloggegevens voor de beheerder-tests.
