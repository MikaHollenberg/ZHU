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
- **Supabase project**: `azdjqqbnexwnhcvbhxoq`, regio **EU-West (Ierland)** (URL/key
  staan in `.env.local`, niet gecommit — zie `.env.example` voor het formaat)
- **Echte bedrijfswebsite**: zeilschooluitgeest.nl — KVK 58125930, BTW
  NL002088313B73, Lagendijk 3a, 1911 MT Uitgeest. Hanteert de HISWA Algemene
  Voorwaarden voor Vaarscholen (PDF op
  `zeilschooluitgeest.nl/elements/docs/voorwaarden.pdf`) — die blijven leidend
  voor de les zelf, het portal linkt er alleen naar (zie "Voorwaarden &
  privacybeleid" hieronder).
- **Security-auditrapport** (Claude Artifact, alle 4 beveiligingsfases):
  https://claude.ai/code/artifact/d743b56b-3e78-43a7-a9ab-eae22d10f9b8

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
  met een `zeilschool-portal`-config in **attach-modus** (`"url":
  "http://localhost:5173"`, geen `runtimeExecutable`) — die laat `preview_start`
  koppelen aan een al draaiende server i.p.v. er zelf een op te starten (dat gaf
  op dit exFAT/netwerkvolume soms EPERM/poortconflict-fouten). Start de server dus
  zelf handmatig op de achtergrond via Bash, en roep `preview_start` daarna pas aan:
  ```bash
  cd "/Volumes/Expansion/ZHUPortal Claude" && npm run dev > /tmp/vite-dev.log 2>&1 &
  disown
  ```
  Check daarna `lsof -ti:5173` om te zien of hij al draait voor je een nieuwe start.
- **Browser-pane sessie-verwarring**: de Claude Browser-pane (tool `seed`-tab) is
  een ANDER browservenster dan de eigen browser van de gebruiker. Als je vraagt om
  in te loggen, wees expliciet of je bedoelt "log in in het venster dat ik hier
  bestuur" — anders logt de gebruiker in bij zichzelf en zie jij niets. Sessies in
  de browser-pane verlopen soms (localStorage leeg na herstart dev-server) — dan
  gewoon opnieuw laten inloggen.
- **Geen `gh` CLI en geen node/npm** stonden bij aanvang van het project op deze
  Mac — beide zijn inmiddels via Homebrew geïnstalleerd. `poppler` (voor
  `pdftotext`) is ook via Homebrew geïnstalleerd, gebruikt om de HISWA-PDF te
  kunnen lezen.
- macOS maakt `._*`-bestanden aan op dit netwerkvolume (AppleDouble). Die staan in
  `.gitignore`, negeer ze.

## Design-systeem (Fase 6 — volledig vernieuwd)

- **Lettertype**: Sora (Google Fonts, geladen in `index.html`), toegepast via
  `--font-sans` in `src/index.css`.
- **Designtokens** staan centraal in `src/index.css` (`@theme`-blok): merkkleuren
  (`brand-blue*`, `brand-yellow*`), **zijbalkkleuren** (`sidebar`/`sidebar-deep`,
  zie hieronder), disciplinekleuren (ongewijzigd, blijven leidend), en
  **statuskleuren** (`status-bevestigd`/`status-wachtend`/`status-geannuleerd`,
  elk met een `-bg`-variant) — gebruik deze voor elke status-achtige badge, nooit
  een losse kleur verzinnen.
- **Herbruikbare classes** (ook in `index.css`): `.card` (afgeronde kaart +
  schaduw), `.badge` (pil-vormig label), `.input`, `.btn-primary`, `.btn-accent`.
  Gebruik deze i.p.v. losse `rounded-md border ...`-combinaties te verzinnen.
- **Iconen**: `src/components/icons.tsx` — kleine inline-SVG's (Check/Clock/X/
  CalendarPlus/ChevronRight/Calendar/Users/Tag/Compass/Book/User/Logout/Menu/
  ChartBar). Status wordt altijd getoond als **kleur + icoon samen**, nooit kleur
  alleen (toegankelijkheid).
- Radiogroepen zijn overal omgezet naar aanklikbare "chips" (verborgen native
  `<input type="radio">` + gestylede `<label>` met `has-[:checked]:...`) i.p.v.
  kale radiobuttons — zie `Availability.tsx` of `BeschikbaarheidOverzicht.tsx` als
  voorbeeld voor het patroon.
- Er is een globale, zichtbare `:focus-visible`-ring (merkkleurig) voor
  toetsenbordnavigatie, met een uitzondering voor `.input` (die heeft al zijn
  eigen focusring).
- Blijf dit systeem consistent gebruiken bij nieuwe schermen/componenten i.p.v.
  ad-hoc Tailwind-classes te verzinnen.

### Navigatie (Fase 7 — zijbalk i.p.v. bovenbalk, beeldvullende lay-out)

Het menu stond eerst bovenaan in een smalle, gecentreerde kolom (`max-w-7xl`).
Dat is vervangen door een vaste linker zijbalk op desktop, met de content
beeldvullend (geen buitenste breedtebeperking meer op `<main>` in
`Layout.tsx` — pagina's die zelf een leesbare breedte willen, zetten daar hun
eigen `mx-auto max-w-*`-wrapper voor, zoals `Home.tsx`, `Availability.tsx`, etc.
al deden).

- **Desktop** (`src/components/Layout.tsx`): vaste `<aside>` van 240px breed
  (`bg-gradient-to-b from-sidebar to-sidebar-deep`), met logo, rol-afhankelijke
  navigatie (`NavLink`, actieve pagina krijgt automatisch `aria-current="page"`
  + een gevulde blauwe pil), en onderaan een gebruikerskaart + uitlog-knop.
- **Mobiel**: het oude hamburgermenu is vervangen door een **vaste onderbalk**
  (iconen + labels, max. 5 tabs getest voor de beheerder) — de navigatie-items
  plus een "Profiel"-tab die naar `/profiel` linkt. De topbalk op mobiel bevat
  alleen nog het logo en een avatar-knop die een klein accountmenu opent (naam,
  rol, uitloggen) — dat menu sluit op Escape (met focus terug naar de
  avatar-knop) en op een klik erbuiten.
- **Toegankelijkheid**: een "Spring naar inhoud"-skiplink (zichtbaar bij
  toetsenbord-focus, linksboven) staat vóór alles in de DOM en springt naar
  `#main-content`. Beide `<nav>`-landmarks hebben `aria-label="Hoofdnavigatie"`.
- **Documenttitel per pagina**: centraal geregeld via `src/lib/pageTitles.ts`
  (route → titel-map) en een `useEffect` in `Layout.tsx` — dus niet per pagina
  apart instellen, gewoon de map bijwerken bij een nieuwe route.
- **Teller-badge**: een rood bolletje met aantal op "Rooster" (beheerder) /
  "Lesgeven" (instructeur) als er iets wacht op actie (openstaande
  instructeur-aanvragen). Logica zit in `Layout.tsx` (`pendingCount`), simpele
  losse `count`-query op `lessen`, geen nieuwe RPC nodig — RLS staat dit al toe.
- Rond hiervan is ook een **mockup als Claude Artifact** gemaakt en goedgekeurd
  vóór de bouw: https://claude.ai/artifact/R8wV8oFLGWCY5gLhXt8JUH — handig als
  referentie bij een volgende visuele iteratie.

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
014_standaard_discipline_en_instructeur_goedkeuring.sql
015_duo_cursus_type.sql
016_onthoud_duo_cursus_type.sql
017_onthoud_lesvorm.sql
018_instructeur_aanvraag_goedkeuring.sql
```

(Fase 1's basis-schema, vóór deze lijst, staat direct in `schema.sql` zelf.)

**Alles hierboven is al uitgevoerd op het live Supabase-project.** Als je nieuwe
databasewijzigingen maakt: voeg een nieuw doorgenummerd bestand toe (`019_...`),
werk `schema.sql` ook bij (voor een verse installatie), en laat de gebruiker het
in de Supabase SQL Editor draaien — plak de inhoud altijd ook direct in de chat
(niet alleen "voer dit bestand uit"), de gebruiker kopieert liever rechtstreeks.

Let op de `alter type ... add value` valkuil: een nieuwe enum-waarde toevoegen
moet in een aparte transactie/los "Run"-moment vóórdat je hem in dezelfde script
gebruikt (zie hoe 012a/012b zijn gesplitst). Let ook op: als je een `check`-
constraint toevoegt op een kolom die al data bevat, eerst een `update` doen om
bestaande rijen een geldige waarde te geven (zie 015/016 voor het patroon).

## Datamodel (kern)

- `profiles` — 1-op-1 met `auth.users`. `rol`: `cursist` | `beheerder` |
  `instructeur`. `gearchiveerd` boolean. Rol-wijziging alleen door beheerder
  (trigger `prevent_role_escalation`, checkt `auth.uid() is not null` zodat de
  SQL Editor zelf niet geblokkeerd wordt). Die trigger blokkeert ook zelf-
  goedkeuring: **`instructeur_goedgekeurd`** mag alleen door de beheerder gezet
  worden. Verder: `standaard_discipline`, `standaard_soort`,
  `standaard_duo_cursus_type` — de onthouden voorkeuren van een cursist (zie
  "Onthouden voorkeuren" hieronder).
- `beschikbaarheid` — cursist/instructeur geeft hele dag beschikbaar/onbeschikbaar
  of een tijdvak door (min. 2 uur). `soort` (privéles/duo_cursus, alleen relevant
  voor cursisten), `discipline` (polyvalk/fox22/windsurf) en `duo_cursus_type`
  (`vijf_keer_twee_uur`/`twee_daagse`, alleen bij duo_cursus) staan hier al op, en
  worden overgenomen naar de les zodra ingepland.
- `lessen` — de daadwerkelijk ingeplande les. `status`: gepland/verzet/
  geannuleerd. `instructeur_id` (nullable, pas gezet ná goedkeuring — zie
  hieronder) en `instructeur_aanvraag_id` (nullable, de *aanvraag* vóór
  goedkeuring). Alle mutaties lopen via RPC's (`plan_les`, `verzet_les`,
  `annuleer_les`, `meld_aan_als_instructeur`, `meld_af_als_instructeur`) — nooit
  rechtstreeks een `update` vanuit de frontend, behalve voor instructeur-koppeling
  en discipline-wijziging door de beheerder (die mag alles via de gewone
  RLS-policy).
- `tweede_persoon` — vaste duo-partner per cursist (uniek op `boeker_id`, dus
  altijd upserten met `onConflict: 'boeker_id'`, nooit los inserten).
- `labels` — redenen voor verzetten/annuleren, door beheerder zelf beheerbaar.

**Instructeur-aanvraag-flow** (Fase 6 van de functionele uitbouw, los van de
security-plan-fases): een instructeur klikt "Aanmelden" op een openstaande les →
dat zet alleen `instructeur_aanvraag_id` (RPC `meld_aan_als_instructeur`, checkt
ook `instructeur_goedgekeurd` op het account). Pas als de beheerder in het
rooster op "Goedkeuren" klikt, wordt dat `instructeur_id` (en de aanvraag
geleegd). Dit is dus een **twee-lagen goedkeuring**: eerst het account
(`instructeur_goedgekeurd`, eenmalig door beheerder), dan per les (de aanvraag).
Niet-goedgekeurde instructeurs mogen de lijst met openstaande lessen wél
bekijken (geen namen), alleen claimen is geblokkeerd — bewuste keuze van de
gebruiker, niet aanpassen zonder het te vragen.

RLS-privacy is grondig getest (zie het security-auditrapport, link hierboven):
cursisten zien nooit elkaars gegevens, instructeurs zien alleen namen van
cursisten waar ze een les mee hebben (via de RPC `lesgever_mijn_cursisten`, nooit
brede profieltoegang), en niemand kan zichzelf een hogere rol of goedkeuring
geven. **Live getest met een script van 20 pogingen (anoniem/cursist/instructeur
die bij andermans data proberen te komen) — allemaal geweigerd.** Zie
`Fase 2` in het auditrapport voor het script-patroon als je dit ooit opnieuw wilt
draaien (tijdelijk `.mjs`-bestand in de project-root, direct verwijderen na de
run, nooit committen).

## Wat is al gebouwd (functioneel)

**Fase 1** — registratie/login, profielbeheer.
**Fase 2** — beschikbaarheid doorgeven (weekkalender-UI), beheerdersrooster met
inplannen.
**Fase 3** — "Mijn lessen" (cursist), verzetten/annuleren met labels.
**Fase 4** — zoekfunctie cursisten, zelf beheerbare labels.
**Extra, op verzoek van de gebruiker**:
- Cursisten archiveren (portaltoegang volledig geblokkeerd, ook op API-niveau).
- Duo-cursus (2 personen per les), opgesplitst in twee vormen: **5x2 uur** en
  **2-daagse cursus** (`duo_cursus_type`), met een vaste, hergebruikte
  duo-partner per cursist — nooit opnieuw hoeven invullen. Beheerder kan de
  partnergegevens bekijken en loskoppelen.
- **Onthouden voorkeuren**: bovenaan de beschikbaarheidspagina kiest een cursist
  één keer zijn "Jouw discipline" en "Jouw lesvorm" (privéles of welke
  duo-vorm) — dat wordt op het profiel onthouden en automatisch toegepast bij
  elke nieuwe dag, in plaats van dat er per dag opnieuw gekozen moet worden. Bij
  een duo-lesvorm verschijnt daar ook meteen het duo-partnerformulier.
- Instructeursrol: eigen beschikbaarheid, aanmelden voor lessen (nu via een
  **aanvraag-en-goedkeuring-flow**, zie datamodel hierboven), beheerderskoppeling,
  eigen "Lesgeven"-overzicht met een aparte "Mijn aanvragen"-sectie.
- **Instructeur-account-goedkeuring**: een nieuw gepromoveerde instructeur start
  op "niet goedgekeurd" (`instructeur_goedgekeurd = false`) en kan pas lessen
  claimen na goedkeuring door de beheerder (Cursisten-pagina, instructeur-tab).
- Disciplines (Polyvalk/Fox22/Windsurf) met kleurcodering + tekstlabel, overal
  consistent (centrale config in `src/lib/disciplines.ts` + Tailwind-theme-tokens
  in `src/index.css`).
- Beheerdersrooster gesplitst in aparte tabellen voor cursisten en instructeurs,
  met per lescel een compact statusicoon (✓/⏳/✕) voor instructeur-koppeling.
- **Wachtwoord vergeten/instellen** (`/wachtwoord-vergeten`,
  `/wachtwoord-instellen`) — was er eerder niet, cursisten hadden geen
  zelfbedieningsoptie. Altijd dezelfde generieke melding, ongeacht of het
  e-mailadres bestaat (voorkomt account-enumeratie).
- **Algemene voorwaarden & privacybeleid** (`/algemene-voorwaarden`,
  `/privacybeleid`), met kleine footer-links op elke pagina. De voorwaarden
  linken naar de bestaande HISWA-PDF (geen dubbele/tegenstrijdige voorwaarden),
  het privacybeleid is nieuw geschreven — zie boven voor bedrijfsgegevens.
- **Volledige visuele vernieuwing (Fase 6)** — zie "Design-systeem" hierboven.
- Huisstijl: logo's van Zeilschool Het Uitgeestermeer (transparant gemaakt,
  origineel stond in `logo's/`), kleurenschema afgeleid van de echte website.
- Responsive: containerbreedte vergroot zodat tabellen op desktop niet meer
  hoeven te scrollen; brede tabellen (rooster) scrollen horizontaal binnen hun
  eigen kader, nooit de hele pagina.
- **Zijbalk-navigatie + beeldvullende lay-out + mobiele onderbalk (Fase 7)** —
  zie "Navigatie" onder Design-systeem hierboven.
- **Statistiekpagina's**: `/statistieken` voor de instructeur (eigen gegeven
  lessen: aantal, uren, cursisten/personen begeleid, per discipline) en
  `/beheer/statistieken` voor de beheerder (schoolbreed: totalen, per
  discipline, privéles vs. duo-cursus, planning gepland/verzet/geannuleerd, per
  instructeur). "Gegeven" = `status = 'gepland'` én `datum <= vandaag` (zie
  `src/lib/stats.ts` voor de uren-/personenberekening, herbruikt door beide
  pagina's via `StatTile.tsx` en `DisciplineBreakdown.tsx`). De instructeur-
  pagina toont bewust **geen namen** van duo-partners of cursisten (alleen
  aggregaten/tellingen) — dat past bij de bestaande RLS-privacyregels
  (`tweede_persoon` is sowieso niet leesbaar voor een instructeur).

## Beveiligingstraject (los actieplan, apart van de functionele fases)

De gebruiker liet een 6-fasen securityplan uitvoeren (audit → RLS-tests →
foutlogs/enumeratie → rate limiting/captcha/CORS → voorwaarden/privacy →
design). Kernresultaten, met het volledige rapport op de artifact-link
hierboven:

- **Fase 1-2**: RLS staat aan op alle tabellen, live geverifieerd tegen de
  database, 20/20 penetratietests geslaagd. Geen service role key in de
  broncode of de uitgeleverde JS-bundel (alleen de publieke anon/publishable
  key, zoals het hoort).
- **Fase 3**: één echt lek gevonden en gefixt — account-enumeratie via
  registratie (Supabase's `identities: []`-gedrag bij een bestaand
  e-mailadres). Fix: stuurt in dat geval stilletjes een reset-mail, toont
  altijd dezelfde melding. Zie `src/pages/Register.tsx`.
- **Fase 4**: **belangrijke vondst, nog niet opgelost** — Supabase's
  ingebouwde e-mail-rate-limit staat op 2/uur voor het hele project (Supabase
  Dashboard → Authentication → Rate Limits), omdat er geen eigen SMTP-provider
  gekoppeld is. Verklaart vermoedelijk waarom een test-account ooit nooit
  bevestigd raakte. Aanbeveling: Resend of Brevo koppelen (Authentication →
  Emails → SMTP Settings), dan pas de limiet verhogen. **Captcha (Cloudflare
  Turnstile) stond ook nog open maar de gebruiker wil dit voorlopig laten
  rusten — niet zelf oppakken tenzij hij er expliciet om vraagt.**
- **Fase 5**: algemene voorwaarden + privacybeleid, zie boven.
- **Fase 6**: volledige designvernieuwing, zie boven.

## Belangrijke gedragsafspraken met de gebruiker (uit dit gesprek)

- De gebruiker (Mika Hollenberg) is zelf de beheerder van de zeilschool, niet per
  se technisch onderlegd — leg SQL-stappen expliciet uit, plak altijd de volledige
  query in de chat.
- Werk instructies uit met echte browsertests (niet alleen `tsc`/`lint`), en meld
  concrete bevindingen — er zijn onderweg meerdere echte bugs gevonden door
  daadwerkelijk te testen (bijv. instructeur_id die verloren ging bij verzetten,
  een naamlek via een cursist_id-lookup, een rijhoogte-bug in het rooster die de
  gebruiker zelf opmerkte). Blijf dat testritme aanhouden.
- Voor kleurwensen ("babyblauw", "subtiel maar aanwezig" voor het logo): de
  gebruiker geeft vaak losse, informele bijsturingen tijdens het werk — reageer
  daar direct op, ook als je middenin iets anders zit.
- Als de gebruiker zegt dat iets "nergens voor nodig is" of iets wil laten rusten
  (bijv. de captcha-stap) — laat het dan ook echt met rust, kom er niet
  ongevraagd op terug in latere sessies.
- Nooit zelf pushen/deployen zonder het aan de gebruiker te vragen; git-acties
  zijn prima om te doen, maar leg uit wat je gaat doen. Bij grotere featurewerk:
  bied aan te committen zodra een stuk werk getest en compleet is, in plaats van
  alles te verzamelen tot het einde van de sessie.
- Bij twijfel over databasekeuzes (bijv. hoe een nieuwe feature het datamodel
  raakt) eerst kort met de gebruiker afstemmen via een paar gerichte vragen,
  in plaats van te gokken — dat is al een paar keer expliciet gewaardeerd.

## Testaccounts (allemaal in het live Supabase-project)

| Rol | E-mail | Wachtwoord |
|---|---|---|
| Cursist | hollenbergmika+cursistb2@gmail.com | TestWachtwoord789 |
| Instructeur (goedgekeurd) | hollenbergmika+cursista@gmail.com | TestWachtwoord123 |
| Instructeur (goedgekeurd) | Luna van der Velden — lunamaan2001@gmail.com | onbekend bij Claude |
| Cursist | hollenbergmika+cursistb@gmail.com | (nooit succesvol bevestigd, niet bruikbaar) |
| Beheerder | hollenbergmika@gmail.com (echt account van de gebruiker) | onbekend bij Claude, gebruiker logt zelf in |

`hollenbergmika+cursista@gmail.com` is via het beheerdersdashboard omgezet naar
**instructeur** — dus geschikt om instructeur-functionaliteit mee te testen,
niet meer om als cursist te testen. `cursistb2` is het huidige bruikbare
cursist-testaccount (is tussentijds ook even tijdelijk instructeur geweest voor
een test, maar staat weer op cursist).

**Opruimen nodig**: tijdens het testen van account-enumeratie (security Fase 3)
is er automatisch een wegwerp-testaccount aangemaakt met een naam als
`hollenbergmika+sectest-<timestamp>@gmail.com` ("Enum Test" in de
Cursisten-lijst). Dat mag de gebruiker verwijderen via Supabase → Authentication
→ Users zodra hij eraan denkt — niet functioneel storend, maar wel ruis in de
cursistenlijst.

## Wat nog open staat / mogelijke vervolgstappen

- **Captcha (Cloudflare Turnstile)** — stappenplan is met de gebruiker
  doorgenomen maar hij wil dit voorlopig laten rusten. Niet ongevraagd oppakken.
- **SMTP-provider koppelen** (Resend/Brevo) om de e-mail-rate-limit van 2/uur op
  te lossen — nog niet gedaan, wel aanbevolen, vraag ernaar als e-mailproblemen
  weer ter sprake komen.
- **Wegwerp-testaccount opruimen** — zie hierboven.
- **E-mailnotificaties** — bewust overgeslagen, gebruiker wilde eerst geen
  externe e-maildienst kiezen (hangt ook samen met het SMTP-punt hierboven).
  Vraag opnieuw als het weer ter sprake komt.
- De instructeur-tabel in het rooster laat de beheerder nog niet toe om een
  lesgever te koppelen aan een cel die nog GEEN les heeft (alleen aan bestaande
  lessen). Zou een logische uitbreiding zijn als de gebruiker vraagt om vanuit de
  instructeur-tabel ook direct te kunnen inplannen.
- **Dag/week/lijst-toggle** op het rooster — losse UX-suggestie uit het
  designplan, geen harde eis, nog niet gebouwd. Alleen oppakken als gevraagd.
- Geen geautomatiseerde tests (unit/e2e) — alles is tot nu toe handmatig getest
  via de browser tijdens elke sessie (en één keer met een tijdelijk
  RLS-penetratietestscript, zie "Beveiligingstraject"). Overweeg dit te
  bespreken als het project groter wordt.
- Check altijd eerst `git status` en `git log origin/main..HEAD` bij een nieuwe
  sessie om te zien of er lokaal werk klaarstaat dat nog niet gepusht is — de
  gebruiker pusht zelf via GitHub Desktop (zie "Tech-details" hierboven).

## Snel starten in een nieuwe sessie

```bash
cd "/Volumes/Expansion/ZHUPortal Claude"
git status && git log --oneline -5
lsof -ti:5173 || (npm run dev > /tmp/vite-dev.log 2>&1 & disown)
```

Open daarna `http://localhost:5173` in de Browser-pane (via `preview_start` met
`{name: "zeilschool-portal"}`, die staat in attach-modus), of vraag de gebruiker
naar zijn eigen inloggegevens voor de beheerder-tests.
