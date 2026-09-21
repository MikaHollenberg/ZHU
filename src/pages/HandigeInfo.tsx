import { Link } from 'react-router-dom'

function TipCard({ emoji, titel, tekst }: { emoji: string; titel: string; tekst: string }) {
  return (
    <div className="card p-4">
      <p className="mb-1.5 flex items-center gap-2 font-semibold text-slate-800">
        <span aria-hidden="true" className="text-lg">
          {emoji}
        </span>
        {titel}
      </p>
      <p className="text-sm text-slate-600">{tekst}</p>
    </div>
  )
}

export function HandigeInfo() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-semibold text-brand-blue-dark">Handige info</h1>
      <p className="mb-8 text-sm text-slate-500">
        Praktische tips waar je wat aan hebt vóór, tijdens en na je zeilles.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TipCard
          emoji="🧥"
          titel="Warme kleding"
          tekst="Op het water is het altijd net even iets frisser. Neem dus voldoende warme kleding mee — hier is meer dan genoeg ruimte voor aan boord. Denk ook aan een regenbroek en -jas: het is snel koud als je nat wordt."
        />
        <TipCard
          emoji="🥪"
          titel="Eten en drinken"
          tekst="Zorg dat je voldoende te eten en te drinken meeneemt. Ook hiervoor is volop ruimte aan boord."
        />
        <TipCard
          emoji="👟"
          titel="Het juiste schoeisel"
          tekst="Soepele schoentjes met voldoende grip zijn altijd handig. De meeste sneakers voldoen hier prima voor, zolang de zool maar niet helemaal glad is."
        />
        <TipCard
          emoji="🕶️"
          titel="Zon en bescherming"
          tekst="Op het water is de zon vaak feller dan je verwacht, door de weerkaatsing. Zonnebrandcrème, een zonnebril en eventueel een petje zijn geen overbodige luxe."
        />
        <TipCard
          emoji="🎒"
          titel="Na afloop"
          tekst="Neem droge kleding en een handdoek mee, zodat je je na de les weer lekker kunt omkleden."
        />
        <TipCard
          emoji="📱"
          titel="Waardevolle spullen"
          tekst="Telefoon, sleutels en andere waardevolle spullen laat je het beste droog aan de wal achter, of neem je mee in een waterdichte tas. Twijfel je? Vraag het gewoon aan je instructeur."
        />
        <TipCard
          emoji="⏰"
          titel="Op tijd aanwezig"
          tekst="Kom bij voorkeur een kwartier voor de starttijd van je les aan, zodat je rustig de tijd hebt om je om te kleden en klaar te maken."
        />
      </div>

      <h2 className="pt-8 text-lg font-semibold text-brand-blue-dark">Twijfel over het weer?</h2>
      <p className="mt-2 text-slate-700">
        Geen zorgen — bij ongeschikt weer (te weinig wind, te veel wind, onweer) verzetten wij je les altijd
        kosteloos naar een ander moment. Lees meer hierover in onze{' '}
        <Link to="/algemene-voorwaarden" className="font-medium text-brand-blue-dark underline">
          algemene voorwaarden
        </Link>
        .
      </p>

      <h2 className="pt-8 text-lg font-semibold text-brand-blue-dark">Waar je ons vindt</h2>
      <p className="mt-2 text-slate-700">
        Zeilschool Het Uitgeestermeer
        <br />
        Lagendijk 3a, 1911 MT Uitgeest
        <br />
        <a href="mailto:info@zeilschooluitgeest.nl" className="text-brand-blue-dark underline">
          info@zeilschooluitgeest.nl
        </a>{' '}
        · 0251 315 197
      </p>
    </div>
  )
}
