import { useEffect, useRef, useState } from 'react'

const HEEL_GETAL = /^\d+$/

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StatTile({
  label,
  value,
  sub,
  badge,
}: {
  label: string
  value: string
  sub?: string
  badge?: number
}) {
  const doel = HEEL_GETAL.test(value) ? parseInt(value, 10) : null
  const [weergave, setWeergave] = useState(doel === null ? value : '0')
  const vorigDoel = useRef<number | null>(null)

  useEffect(() => {
    if (doel === null) {
      setWeergave(value)
      return
    }
    if (vorigDoel.current === doel) return
    vorigDoel.current = doel

    if (doel === 0 || prefersReducedMotion()) {
      setWeergave(String(doel))
      return
    }

    const duur = 600
    const start = performance.now()
    let frame: number

    const tick = (nu: number) => {
      const voortgang = Math.min((nu - start) / duur, 1)
      const uitgevlakt = 1 - (1 - voortgang) ** 3
      setWeergave(String(Math.round(uitgevlakt * doel)))
      if (voortgang < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doel])

  return (
    <div className="card relative px-4 py-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-blue-dark">{weergave}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge} openstaand`}
          className="absolute right-2.5 top-2.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-status-geannuleerd px-1.5 text-[10px] font-bold text-white"
        >
          {badge}
        </span>
      )}
    </div>
  )
}
