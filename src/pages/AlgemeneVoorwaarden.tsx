export function AlgemeneVoorwaarden() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-semibold text-brand-blue-dark">Algemene voorwaarden</h1>
      <p className="mb-8 text-sm text-slate-500">Laatst bijgewerkt: 21 september 2026</p>

      <div className="space-y-4 text-slate-700">
        <p>
          Zeilschool Het Uitgeestermeer (Zeilschool &amp; Bootverhuur Het Uitgeestermeer) is lid van HISWA Vereniging
          en hanteert voor al haar vaarinstructie de{' '}
          <a
            href="https://www.zeilschooluitgeest.nl/elements/docs/voorwaarden.pdf"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-blue-dark underline"
          >
            HISWA Algemene Voorwaarden voor Vaarscholen
          </a>
          . Deze voorwaarden gelden voor iedere priveles die via dit portal wordt geboekt, en regelen onder andere de
          totstandkoming van de boeking, prijzen en betaling, annulering, aansprakelijkheid en overmacht.
        </p>

        <p>
          Dit portal is het hulpmiddel waarmee je je beschikbaarheid doorgeeft en je lessen inziet. De voorwaarden
          hieronder gelden aanvullend, specifiek voor het gebruik van dit portal zelf. Bij tegenstrijdigheid tussen
          deze aanvulling en de HISWA-voorwaarden, gaan de HISWA-voorwaarden voor wat betreft de les zelf.
        </p>

        <h2 className="pt-4 text-lg font-semibold text-brand-blue-dark">Aanvullende voorwaarden voor het portal</h2>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Je account</h3>
          <p>
            Je bent zelf verantwoordelijk voor het geheimhouden van je wachtwoord en voor de juistheid van de
            gegevens die je invoert (naam, contactgegevens, geboortedatum en geboorteplaats, en indien van
            toepassing die van je duo-partner). Merk je dat iemand anders mogelijk toegang heeft tot je account? Neem
            dan direct contact met ons op.
          </p>
          <p className="mt-2">
            <strong>Let op bij diploma-registratie:</strong> kloppen je gegevens niet en komen ze daardoor verkeerd
            op je vaardigheidsbewijs of diploma te staan, dan is dat je eigen verantwoordelijkheid. Onjuiste
            gegevens kun je zelf corrigeren in je account bij de CWO (Commissie Watersport Opleidingen). Is je
            diploma al uitgereikt, dan kan de papieren versie helaas niet meer worden aangepast — je behaalde
            niveau staat dan wel gewoon goed geregistreerd in het digitale CWO-systeem.
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Beschikbaarheid doorgeven is geen boekingsgarantie</h3>
          <p>
            Het doorgeven van beschikbaarheid in het portal is een aanbod van jouw kant om op dat moment les te
            volgen. Er komt pas een les tot stand zodra wij die daadwerkelijk inplannen — dat zie je terug in "Mijn
            lessen".
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Verzetten en annuleren — onze coulanceregeling</h3>
          <p>
            Een geplande les verzet of annuleer je niet zelfstandig in het portal, maar via ons — neem contact op via
            de gegevens onderaan deze pagina. Voor de algemene voorwaarden rondom verzetten en annuleren verwijzen we
            naar artikel 7 van de HISWA-voorwaarden hierboven. Daarbovenop hanteren wij, als zeilschool, de volgende
            coulanceregeling:
          </p>
          <p className="mt-3">
            <strong>Weer ongeschikt om te varen.</strong> Is het volgens ons niet verantwoord om te varen — te
            weinig wind, te veel wind, onweer — dan verzetten wij de les kosteloos naar een nieuw moment. Wij als
            zeilschool beoordelen wanneer dit het geval is.
          </p>
          <p className="mt-3">
            <strong>Zelf verzetten of annuleren: kosteloos tot 48 uur van tevoren.</strong> Kun je zelf niet op het
            geplande moment? Geef dit tot 48 uur van tevoren aan ons door, dan verzetten of annuleren we je les
            kosteloos — binnen alle redelijkheid: we kunnen niet voor elke kleine aanpassing het rooster omgooien.
            Denk bij "alle redelijkheid" bijvoorbeeld aan onverwachte, dringende omstandigheden zoals een overlijden
            of begrafenis, een medische reden, of een ander ernstig persoonlijk voorval. Een drukke week of iets
            anders leuks die dag valt hier niet onder.
          </p>
          <div className="mt-3 rounded-xl bg-status-geannuleerd-bg px-4 py-3 text-status-geannuleerd">
            <strong>Binnen 48 uur?</strong> Dan brengen we hiervoor kosten in rekening, conform artikel 7 van de
            HISWA-voorwaarden hierboven.
          </div>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Instructeurs</h3>
          <p>
            Instructeurs die via het portal beschikbaarheid doorgeven of zich aanmelden voor een les, doen dit onder
            goedkeuring van de beheerder. Een aanmelding is pas definitief zodra deze is goedgekeurd.
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Jouw gegevens</h3>
          <p>
            Hoe we omgaan met de persoonsgegevens die je in het portal invoert, staat beschreven in ons{' '}
            <a href="/privacybeleid" className="font-medium text-brand-blue-dark underline">
              privacybeleid
            </a>
            .
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-slate-800">Wijzigingen</h3>
          <p>
            We kunnen deze aanvullende voorwaarden van tijd tot tijd wijzigen. De meest actuele versie staat altijd
            op deze pagina.
          </p>
        </div>

        <h2 className="pt-4 text-lg font-semibold text-brand-blue-dark">Contactgegevens</h2>
        <p>
          Zeilschool Het Uitgeestermeer
          <br />
          Lagendijk 3a, 1911 MT Uitgeest
          <br />
          KVK 58125930 · BTW NL002088313B73
          <br />
          <a href="mailto:info@zeilschooluitgeest.nl" className="text-brand-blue-dark underline">
            info@zeilschooluitgeest.nl
          </a>{' '}
          · 0251 315 197
        </p>
      </div>
    </div>
  )
}
