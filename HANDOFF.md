# Overdracht — Priveles-portal Zeilschool Het Uitgeestermeer

Lees dit bestand als eerste in een nieuwe sessie om snel weer op snelheid te zijn.

## Wat is dit

Een webportal voor priveslessen van Zeilschool Het Uitgeestermeer. Cursisten geven
beschikbaarheid door, de beheerder plant lessen in, instructeurs kunnen lessen
geven. React + Vite + TypeScript + Tailwind, met Supabase (Postgres + Auth + Row
Level Security) als backend. Geen aparte server — alles draait via Supabase's API
rechtstreeks vanuit de browser, op één uitzondering na: de windvoorspelling op het
dashboard komt van Open-Meteo (gratis, geen API-key, gewone `fetch`).

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
- **Security-auditrapport** (Claude Artifact, de eerste 4 beveiligingsfases —
  de latere functie-hardening/headers/wachtwoordlengte staan niet in dit
  rapport, wel hieronder in dit document):
  https://claude.ai/code/artifact/d743b56b-3e78-43a7-a9ab-eae22d10f9b8

## ⚠️ Check dit als eerste in een nieuwe sessie

Dit project is één keer per ongeluk **gelijktijdig vanuit twee losse
Claude Code-vensters** bewerkt zonder dat beide sessies van elkaar afwisten —
dezelfde mapnaam, geen git-worktree-isolatie. Dat leverde geen dataverlies op
(git heeft alles netjes bewaard), maar wel verwarring. Voorkom dat:

```bash
cd "/Volumes/Expansion/ZHUPortal Claude"
git status                        # hoort "clean" te zijn
git log origin/main..HEAD --oneline   # hoort leeg te zijn (alles gepusht)
git log --oneline -5              # vergelijk met de lijst hieronder — staat er iets nieuws?
```

Vraag de gebruiker expliciet of er nog een ander venster/sessie open staat op dit
project voordat je begint, zeker als je hier na een lange pauze weer instapt.

## Tech-details om te weten

- **Git push via de CLI**: werkte een tijd lang niet (geen credential helper
  ingesteld) — de gebruiker pushte dan zelf via **GitHub Desktop**. Sinds
  2026-09-17 werkt `git push` vanuit een Claude Code-sessie soms gewoon
  (er staat blijkbaar inmiddels een credential helper), maar dat kan per
  sessie/machine verschillen. Probeer het gewoon en val terug op "vraag de
  gebruiker om via GitHub Desktop te pushen" als het een auth-fout geeft —
  neem niet meer automatisch aan dat CLI-push kapot is.
- **Vercel deployt automatisch** bij elke push naar `main`. `vercel.json` bevat
  een rewrite-regel (client-side routing met React Router — zonder dat geeft
  elke pagina behalve `/` een 404 bij verversen) én een set
  **beveiligingsheaders** (CSP, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, HSTS). Voeg je een nieuwe externe
  API/host toe (zoals Open-Meteo), dan moet die ook in de CSP's `connect-src`
  staan, anders blokkeert de browser het stilletjes.
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
- `npm audit` staat op 0 kwetsbaarheden (laatst gecheckt bij de dependency-update
  in de functie-hardening-commit). Bij twijfel gewoon opnieuw draaien.

## Navigatie & lay-out

**Zijbalk op desktop, onderbalk met iconen op mobiel** — vervangt het oude
bovenmenu met hamburgermenu volledig (`src/components/Layout.tsx`, groot bestand,
~430 regels). Geen vaste max-breedte meer op de content — de pagina's zijn nu
beeldvullend. Belangrijk om te weten voor nieuwe schermen:
- Nieuwe iconen horen in `src/components/icons.tsx` (inline SVG's, zelfde patroon
  als de bestaande).
- Documenttitel per route staat centraal in `src/lib/pageTitles.ts` — nieuwe route
  toevoegen? Ook hier een regel toevoegen.
- Toegankelijkheid: er is een skip-link en `aria-current` op de actieve
  navigatie-link — blijf dat patroon aanhouden.
- Het tellertje voor openstaande instructeur-aanvragen (badge in de navigatie)
  komt uit de gedeelde hook `src/lib/usePendingAanvragen.ts` — die wordt ook
  gebruikt op het dashboard. Nieuwe plekken die dit aantal nodig hebben: gebruik
  deze hook, bouw het niet opnieuw.

## Design-systeem

- **Lettertype**: Sora (Google Fonts, geladen in `index.html`), toegepast via
  `--font-sans` in `src/index.css`.
- **Designtokens** staan centraal in `src/index.css` (`@theme`-blok): merkkleuren
  (`brand-blue*`, `brand-yellow*`), disciplinekleuren (ongewijzigd, blijven
  leidend), en **statuskleuren** (`status-bevestigd`/`status-wachtend`/
  `status-geannuleerd`, elk met een `-bg`-variant) — gebruik deze voor elke
  status-achtige badge, nooit een losse kleur verzinnen.
- **Herbruikbare classes** (ook in `index.css`): `.card` (afgeronde kaart +
  schaduw), `.badge` (pil-vormig label), `.input`, `.btn-primary`, `.btn-accent`.
  Gebruik deze i.p.v. losse `rounded-md border ...`-combinaties te verzinnen.
- **Statistiek-componenten**: `StatTile.tsx` (kerncijfer-tegel) en
  `DisciplineBreakdown.tsx` (verdeling per discipline) — gebruikt op de
  Statistieken-pagina's en het dashboard, herbruikbaar voor nieuwe cijfer-
  overzichten. Rekenhulpjes (`lesUren`, `lesPersonen`, `formatUren`) staan in
  `src/lib/stats.ts`.
- **Dashboard-componenten**: `HeroLesCard.tsx` (uitgelichte "volgende les"-kaart)
  en `QuickActionCard.tsx` (tikbare snelkoppeling-kaart) — beide op `Home.tsx`.
- Radiogroepen zijn overal omgezet naar aanklikbare "chips" (verborgen native
  `<input type="radio">` + gestylede `<label>` met `has-[:checked]:...`) i.p.v.
  kale radiobuttons — zie `Availability.tsx` of `BeschikbaarheidOverzicht.tsx` als
  voorbeeld voor het patroon.
- Er is een globale, zichtbare `:focus-visible`-ring (merkkleurig) voor
  toetsenbordnavigatie, met een uitzondering voor `.input` (die heeft al zijn
  eigen focusring).
- **Mobiele 2-koloms-grid-valkuil**: een `grid grid-cols-2 gap-4` met daarin een
  `<input type="date">` overlapte op smalle schermen met het ernaast liggende
  veld (native datumvelden hebben geen flexibele minimumbreedte). Patroon:
  `grid-cols-1 sm:grid-cols-2` i.p.v. altijd `grid-cols-2` zodra er een
  datumveld in een grid staat naast iets anders. Kom je dit patroon ergens
  nieuws tegen, pas het gelijk zo aan.
- Blijf dit systeem consistent gebruiken bij nieuwe schermen/componenten i.p.v.
  ad-hoc Tailwind-classes te verzinnen.

## Animaties (toegevoegd 2026-09-17)

Gedeelde keyframes/utility-classes staan onderaan `src/index.css` (na de
`prefers-reduced-motion`-regel, die alle animaties op deze pagina ook automatisch
afvlakt): `.stagger-in` (gestaffelde kaarten-intro), `.animate-badge-pop`,
`.animate-milestone-pop`, `.animate-ring-pulse`, `.animate-toast-in`,
`.animate-compass` (kompas-naald-zwaai) en `.animate-spotlight-pulse` (voor de
rondleiding hieronder). Toegepast op:
- Dashboard-kaarten glijden gestaffeld in beeld (`stagger-in`-wrapper in elk van
  de drie rol-varianten in `Home.tsx`).
- `QuickActionCard.tsx` lift op bij hover.
- `Home.tsx`'s `InstructeurStatusIcon` toont een vinkje-pop, maar **alleen** voor
  de les die net is goedgekeurd (`justConfirmedId`-state in `BeheerderHome`) —
  niet bij elke render, anders zou elk vinkje bij elke data-refresh poppen.
- `StatTile.tsx` telt op vanaf 0 naar het echte getal (alleen bij een zuiver
  geheel getal als `value`, dus niet bij `formatUren()`-output zoals "12,5 uur";
  respecteert `prefers-reduced-motion` ook los van de CSS-regel, want dit is een
  JS-`requestAnimationFrame`-animatie).
- `Layout.tsx`: de actieve-indicator in de desktop-zijbalk is een los element dat
  via `useLayoutEffect` + `offsetTop`/`offsetHeight` van het actieve `NavLink`
  meet waar hij moet staan (geen library, geen vaste pixelwaarden) — alleen op
  desktop, de mobiele onderbalk is ongemoeid gelaten.
- `Home.tsx`'s `BeheerderHome` toont een toast rechtsonder na "Goedkeuren".
- **`Loader.tsx`** (nieuw, gedeeld component) vervangt de oude losse
  `animate-spin`-spinner die voorheen op 13 plekken letterlijk gekopieerd stond —
  nieuwe laadindicator overal? Gebruik `<Loader />` (optioneel `label`/
  `className`), nooit opnieuw een spinner losstaand opbouwen.
- `HeroLesCard.tsx`'s mijlpaalbadge (🎉) popt + twee uitdeinende ringen.

## Rondleiding beschikbaarheid (`OnboardingTour.tsx`, toegevoegd 2026-09-17)

Spotlight-rondleiding, alleen op `Availability.tsx`, geschreven voor 60+
gebruikers (grote tekst, korte zinnen, expliciete "Volgende/Vorige/Sla
over"-knoppen). Werking:
- Stappen (`bouwTourStappen()` in `Availability.tsx`) markeren een echt
  schermdeel via een `targetId` dat met een `id`-attribuut op de bestaande JSX
  staat (`tour-discipline`, `tour-lesvorm`, `tour-duo-partner`,
  `tour-kalender`) — `OnboardingTour.tsx` meet zelf de positie via
  `getBoundingClientRect` en scrollt het in beeld, geen aparte tooltip-library.
  Nieuwe stap toevoegen? Zet een `id` op het echte element en voeg een entry toe
  aan de `stappen`-array.
- Discipline- en lesvorm-stap noemen expliciet `info@zeilschooluitgeest.nl` voor
  advies bij twijfel — bewuste eis van de gebruiker, laat dat staan.
- Duo-partner-stap verschijnt alleen als `standaardSoort === 'duo_cursus'` op het
  moment dat de rondleiding wordt geopend (niet live herberekend tijdens het
  doorlopen — acceptabel edge-case).
- Instructeurs krijgen een kortere versie (geen discipline/lesvorm/duo-stappen,
  want die kiezen zij niet) — zie de `isInstructeur`-tak in `bouwTourStappen()`.
- Onthouden via `localStorage`-sleutel `zhu_tour_beschikbaarheid_v1` (opent
  automatisch, één keer, bij een nieuwe gebruiker); wrapped in try/catch voor
  privénavigatie.
- **Opnieuw starten**: een "Rondleiding"-knop staat in `Layout.tsx`, in de
  desktop-zijbalk (boven de naam/Uitloggen-knop) én in het mobiele
  accountmenu (boven Uitloggen) — beide alleen zichtbaar voor cursist/
  instructeur-rollen (niet beheerder, niet gearchiveerd). De knop navigeert
  naar `/beschikbaarheid` met `state: { openTour: true }`; `Availability.tsx`
  leest dat via `useLocation` en opent de tour, ook vanaf een andere pagina.

## Dashboard (startpagina, `src/pages/Home.tsx`)

Rolafhankelijk, geen kale titel meer:
- **Cursist**: uitgelichte "volgende les"-kaart (dag, tijd, discipline, status,
  countdown) of een uitnodiging om beschikbaarheid door te geven; zachte
  herinnering als er voor de komende week nog niets is doorgegeven;
  duo-partnernaam; "lessen deze maand"; mijlpaal-badge bij een rond aantal
  gegeven lessen (5, 10, 25, ...); windkracht (Bft) + richting bij de volgende
  les via Open-Meteo (alleen zichtbaar binnen het voorspelbereik van die
  gratis API, dus niet te ver in de toekomst).
- **Instructeur**: melding bij een openstaande aanvraag of een nog niet
  goedgekeurd account; eigen volgende les met cursistnaam (via de bestaande
  privacy-RPC `lesgever_mijn_cursisten`, dus geen nieuwe privacylek).
- **Beheerder**: kerncijfers, een "komende week"-overzicht met
  instructeur-koppelstatus, een "vandaag"-highlight, en instructeur-aanvragen
  direct vanaf het dashboard goedkeuren zonder naar het Rooster te hoeven.

## Statistieken

Twee nieuwe pagina's, beide alleen lezend (geen mutaties):
- `/statistieken` (instructeur-rol) — `src/pages/InstructeurStatistieken.tsx`.
- `/beheer/statistieken` (beheerder-rol) — `src/pages/admin/Statistieken.tsx`.

Gebruiken `src/lib/stats.ts` voor lesuren/aantal-personen-berekeningen en de
`StatTile`/`DisciplineBreakdown`-componenten. Geen aparte database-views of
RPC's voor nodig — rekent client-side over de al opgehaalde `lessen`-rijen.

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
019_functie_hardening.sql       ← search_path vastzetten + EXECUTE intrekken
020_functie_hardening_deel2.sql ← dode plan_les-overloads opruimen + PUBLIC-grant dicht
```

(Fase 1's basis-schema, vóór deze lijst, staat direct in `schema.sql` zelf.)

**Alles hierboven is al uitgevoerd op het live Supabase-project.** Als je nieuwe
databasewijzigingen maakt: voeg een nieuw doorgenummerd bestand toe (`021_...`),
werk `schema.sql` ook bij (voor een verse installatie), en laat de gebruiker het
in de Supabase SQL Editor draaien — plak de inhoud altijd ook direct in de chat
(niet alleen "voer dit bestand uit"), de gebruiker kopieert liever rechtstreeks.

Let op de `alter type ... add value` valkuil: een nieuwe enum-waarde toevoegen
moet in een aparte transactie/los "Run"-moment vóórdat je hem in dezelfde script
gebruikt (zie hoe 012a/012b zijn gesplitst). Let ook op: als je een `check`-
constraint toevoegt op een kolom die al data bevat, eerst een `update` doen om
bestaande rijen een geldige waarde te geven (zie 015/016 voor het patroon). En:
als je een functie-signature wijzigt (parameters toevoegen/verwijderen),
`create or replace` vervangt alleen een EXACT gelijke signature — oudere
overloads met minder parameters blijven anders los rondslingeren als dode code
die nog steeds via de REST-RPC aanroepbaar is (zie 020 voor het opruimpatroon).

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
  RLS-policy). Deze drie eerste RPC's hebben een vastgezette `search_path` (zie
  migratie 019) — houd dat aan bij toekomstige `create or replace`.
- `tweede_persoon` — vaste duo-partner per cursist (uniek op `boeker_id`, dus
  altijd upserten met `onConflict: 'boeker_id'`, nooit los inserten).
- `labels` — redenen voor verzetten/annuleren, door beheerder zelf beheerbaar.

**Instructeur-aanvraag-flow**: een instructeur klikt "Aanmelden" op een
openstaande les → dat zet alleen `instructeur_aanvraag_id` (RPC
`meld_aan_als_instructeur`, checkt ook `instructeur_goedgekeurd` op het
account). Pas als de beheerder in het rooster (of nu ook: op het dashboard) op
"Goedkeuren" klikt, wordt dat `instructeur_id` (en de aanvraag geleegd). Dit is
dus een **twee-lagen goedkeuring**: eerst het account
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
- Instructeursrol: eigen beschikbaarheid, aanmelden voor lessen (via de
  aanvraag-en-goedkeuring-flow, zie datamodel hierboven), beheerderskoppeling,
  eigen "Lesgeven"-overzicht met een aparte "Mijn aanvragen"-sectie, en nu ook
  een eigen Statistieken-pagina.
- **Instructeur-account-goedkeuring**: een nieuw gepromoveerde instructeur start
  op "niet goedgekeurd" (`instructeur_goedgekeurd = false`) en kan pas lessen
  claimen na goedkeuring door de beheerder (Cursisten-pagina, instructeur-tab).
- Disciplines (Polyvalk/Fox22/Windsurf) met kleurcodering + tekstlabel, overal
  consistent (centrale config in `src/lib/disciplines.ts` + Tailwind-theme-tokens
  in `src/index.css`).
- Beheerdersrooster gesplitst in aparte tabellen voor cursisten en instructeurs,
  met per lescel een compact statusicoon (✓/⏳/✕) voor instructeur-koppeling.
- **Wachtwoord vergeten/instellen** (`/wachtwoord-vergeten`,
  `/wachtwoord-instellen`) — altijd dezelfde generieke melding, ongeacht of het
  e-mailadres bestaat (voorkomt account-enumeratie). Minimale wachtwoordlengte
  is 8 tekens (zowel bij registreren als bij wachtwoord instellen).
- **Algemene voorwaarden & privacybeleid** (`/algemene-voorwaarden`,
  `/privacybeleid`), met kleine footer-links op elke pagina. De voorwaarden
  linken naar de bestaande HISWA-PDF (geen dubbele/tegenstrijdige voorwaarden),
  het privacybeleid is nieuw geschreven — zie boven voor bedrijfsgegevens.
- **Volledige visuele vernieuwing + zijbalk-navigatie + dashboard +
  statistieken** — zie de aparte secties hierboven.
- Huisstijl: logo's van Zeilschool Het Uitgeestermeer (transparant gemaakt,
  origineel stond in `logo's/`), kleurenschema afgeleid van de echte website.
  Logo staat in de zijbalk op een witte chip zodat het loskomt van de donkere
  achtergrond.
- Responsive: zijbalk op desktop, onderbalk met iconen op mobiel; brede tabellen
  (rooster) scrollen horizontaal binnen hun eigen kader, nooit de hele pagina;
  mobiele 2-koloms-grids met een datumveld stapelen nu op smalle schermen (zie
  Design-systeem hierboven).

## Beveiligingstraject

De gebruiker liet een 6-fasen securityplan uitvoeren (audit → RLS-tests →
foutlogs/enumeratie → rate limiting/captcha/CORS → voorwaarden/privacy →
design), en daarna nog een losse hardeningsronde. Kernresultaten:

- **Fase 1-2**: RLS staat aan op alle tabellen, live geverifieerd tegen de
  database, 20/20 penetratietests geslaagd. Geen service role key in de
  broncode of de uitgeleverde JS-bundel (alleen de publieke anon/publishable
  key, zoals het hoort). Volledig rapport op de artifact-link hierboven.
- **Fase 3**: account-enumeratie via registratie gevonden en gefixt (Supabase's
  `identities: []`-gedrag bij een bestaand e-mailadres) — stuurt in dat geval
  stilletjes een reset-mail, toont altijd dezelfde melding. Zie
  `src/pages/Register.tsx`.
- **Fase 4**: Supabase's ingebouwde e-mail-rate-limit staat op 2/uur voor het
  hele project (Dashboard → Authentication → Rate Limits) omdat er geen eigen
  SMTP-provider gekoppeld is — **nog steeds niet opgelost**, zie "Wat nog open
  staat". Captcha (Cloudflare Turnstile) stond ook nog open maar de gebruiker
  wil dit laten rusten — niet zelf oppakken tenzij hij er expliciet om vraagt.
- **Fase 5**: algemene voorwaarden + privacybeleid, zie boven.
- **Fase 6**: designvernieuwing + later ook zijbalk/dashboard/statistieken, zie
  boven.
- **Latere hardeningsronde** (migraties 019/020, niet in het artifact-rapport):
  `search_path` vastgezet op `plan_les`/`verzet_les`/`annuleer_les`
  (voorkomt search_path-kaping); drie verouderde `plan_les`-overloads
  verwijderd die nog los aanroepbaar waren via de REST-RPC met minder
  validatie; `EXECUTE` op de trigger-only functies `handle_new_user` en
  `prevent_role_escalation` ingetrokken voor `anon`/`authenticated`/`public`
  (triggers zelf blijven gewoon werken). Plus: dependency-update (`npm
  update`, 0 kwetsbaarheden voor en na), en beveiligingsheaders in
  `vercel.json` (CSP, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, HSTS). Wachtwoord-minimumlengte naar 8
  tekens (HaveIBeenPwned-leaked-password-check zit achter Supabase's betaalde
  Pro-plan, dus niet beschikbaar op dit gratis project — dit was het concrete
  alternatief).

## Belangrijke gedragsafspraken met de gebruiker (uit dit gesprek)

- De gebruiker (Mika Hollenberg) is zelf de beheerder van de zeilschool, niet per
  se technisch onderlegd — leg SQL-stappen expliciet uit, plak altijd de volledige
  query in de chat.
- Werk instructies uit met echte browsertests (niet alleen `tsc`/`lint`), en meld
  concrete bevindingen — er zijn onderweg meerdere echte bugs gevonden door
  daadwerkelijk te testen (bijv. instructeur_id die verloren ging bij verzetten,
  een naamlek via een cursist_id-lookup, een rijhoogte-bug in het rooster die de
  gebruiker zelf opmerkte, overlappende velden op mobiel). Blijf dat testritme
  aanhouden.
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
- **Nooit ervan uitgaan dat je de enige actieve sessie op dit project bent** —
  vraag dit na bij een lange pauze of als bestanden onverwacht al gewijzigd
  blijken (zie de waarschuwing bovenaan dit document).

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

**Let op — accounts kunnen tussentijds gearchiveerd raken**: op 2026-09-17 bleken
zowel `cursista` als `cursistb2` gearchiveerd te staan (`profiles.gearchiveerd =
true`), waardoor inloggen alleen de "Account gearchiveerd"-melding toonde —
niet iets dat deze sessie zelf heeft veroorzaakt, waarschijnlijk eerder
handmatig getest. `cursistb2` is met toestemming van de gebruiker via Supabase
(`update profiles set gearchiveerd = false where id = (select id from
auth.users where email = '...')`) weer geactiveerd om de UI live te kunnen
testen. Check dus bij twijfel eerst `select rol, gearchiveerd, count(*) from
profiles group by rol, gearchiveerd` (geen PII, mag altijd) voordat je aanneemt
dat een testaccount werkt.

**Mogelijk nog op te ruimen**: tijdens het testen van account-enumeratie
(security Fase 3) is er automatisch een wegwerp-testaccount aangemaakt met een
naam als `hollenbergmika+sectest-<timestamp>@gmail.com` ("Enum Test" in de
Cursisten-lijst). Check of die nog in Supabase → Authentication → Users staat en
verwijder 'm dan — niet functioneel storend, maar wel ruis in de cursistenlijst.
Sinds het wachtwoord-minimum nu 8 tekens is: bestaande testaccounts met een
korter wachtwoord (bijv. `TestWachtwoord789` is 17 tekens, dus prima) hoeven
niet aangepast te worden — de nieuwe eis geldt alleen bij het aanmaken/
resetten, niet met terugwerkende kracht.

## Wat nog open staat / mogelijke vervolgstappen

- **SMTP-provider koppelen** (Resend/Brevo) om de e-mail-rate-limit van 2/uur op
  te lossen — nog niet gedaan, wel aanbevolen, vraag ernaar als e-mailproblemen
  weer ter sprake komen.
- **Captcha (Cloudflare Turnstile)** — stappenplan is met de gebruiker
  doorgenomen maar hij wil dit voorlopig laten rusten. Niet ongevraagd oppakken.
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
- Laatste commit (`291db02`, animaties + rondleiding beschikbaarheid) staat
  **gepusht en live** — geen actie nodig, tenzij
  er weer nieuw werk lokaal klaarstaat (check altijd eerst `git status` en
  `git log origin/main..HEAD` bij een nieuwe sessie om te zien of er iets
  ongepusht is blijven staan — zie ook de waarschuwing bovenaan dit document).

## Snel starten in een nieuwe sessie

```bash
cd "/Volumes/Expansion/ZHUPortal Claude"
git status && git log --oneline -5
lsof -ti:5173 || (npm run dev > /tmp/vite-dev.log 2>&1 & disown)
```

Open daarna `http://localhost:5173` in de Browser-pane (via `preview_start` met
`{name: "zeilschool-portal"}`, die staat in attach-modus), of vraag de gebruiker
naar zijn eigen inloggegevens voor de beheerder-tests. Vraag ook na of er nog een
ander venster open staat op dit project (zie bovenaan).
