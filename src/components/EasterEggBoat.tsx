import type { CSSProperties } from 'react'

// Verborgen grapje: klik op het logo (zie Layout.tsx) en er vaart vloeiend
// een bootje over het scherm. Puur voor de lol, geen functionaliteit. Alle
// afstanden staan in vw/vh, zodat dit op elk schermformaat (ook mobiel)
// hetzelfde aanvoelt. Het bootje is bewust twee geneste lagen: de buitenste
// vaart in één rustige haal over het scherm, de binnenste laat het los
// daarbovenop zacht deinen — dat oogt vloeiender dan alles in één animatie
// met veel tussenstops proppen.
export function EasterEggBoat() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-50 animate-sail-wake text-2xl opacity-40"
        style={{ '--wake-delay': '380ms' } as CSSProperties}
      >
        💦
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-50 animate-sail-wake text-xl opacity-25"
        style={{ '--wake-delay': '620ms' } as CSSProperties}
      >
        💦
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-50 animate-sail-glide">
        <div className="animate-boat-bob text-6xl">⛵</div>
      </div>
    </>
  )
}
