import type { CSSProperties } from 'react'

// Verborgen grapje: klik op het logo (zie Layout.tsx) en het hele scherm vult
// zich met een vloeiend varend bootje en een regen van confetti. Puur voor de
// lol, geen functionaliteit. Alle afstanden staan in vw/vh, zodat dit op elk
// schermformaat (ook mobiel) hetzelfde aanvoelt. Het bootje is bewust twee
// geneste lagen: de buitenste vaart in één rustige haal over het scherm, de
// binnenste laat het los daarbovenop zacht deinen — dat oogt vloeiender dan
// alles in één animatie met veel tussenstops proppen.
const CONFETTI_RAIN = [
  { left: '4%', delay: '0ms', duration: '3.6s', emoji: '🎉' },
  { left: '11%', delay: '260ms', duration: '3.9s', emoji: '✨' },
  { left: '18%', delay: '80ms', duration: '3.4s', emoji: '🎊' },
  { left: '27%', delay: '420ms', duration: '4s', emoji: '⭐' },
  { left: '35%', delay: '160ms', duration: '3.7s', emoji: '✨' },
  { left: '44%', delay: '520ms', duration: '3.5s', emoji: '🎉' },
  { left: '52%', delay: '60ms', duration: '4s', emoji: '🎊' },
  { left: '60%', delay: '380ms', duration: '3.6s', emoji: '⭐' },
  { left: '68%', delay: '140ms', duration: '3.9s', emoji: '✨' },
  { left: '76%', delay: '460ms', duration: '3.4s', emoji: '🎉' },
  { left: '84%', delay: '220ms', duration: '4s', emoji: '🎊' },
  { left: '91%', delay: '600ms', duration: '3.7s', emoji: '⭐' },
  { left: '8%', delay: '700ms', duration: '3.5s', emoji: '✨' },
  { left: '58%', delay: '340ms', duration: '3.8s', emoji: '🎉' },
  { left: '96%', delay: '300ms', duration: '3.6s', emoji: '🎊' },
]

export function EasterEggBoat() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {CONFETTI_RAIN.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 animate-confetti-fall text-2xl"
            style={{ left: c.left, animationDelay: c.delay, animationDuration: c.duration }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <span className="max-w-[92vw] animate-toast-in whitespace-normal rounded-full bg-brand-blue-dark px-4 py-2 text-center text-sm font-bold text-white shadow-lg sm:text-base">
          ✨ ⛵ Toet toet! Bon voyage! ⛵ ✨
        </span>
      </div>

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
