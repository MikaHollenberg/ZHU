import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DisciplineBadge } from './DisciplineBadge'
import { CalendarPlusIcon } from './icons'
import { countdownLabel, dagAfkorting, dagNummer } from '../lib/datum'
import { STATUS_LABELS, STATUS_STYLES } from '../lib/lesStatus'
import { haalWeerVoorDatum } from '../lib/weer'
import type { DagWeer } from '../lib/weer'
import type { Les } from '../types/lesson'

type HeroLesCardProps = {
  les: Les | null
  label: string
  metaText?: string
  milestoneLabel?: string
  emptyTitle: string
  emptySub: string
  emptyCtaLabel: string
  emptyCtaTo: string
}

export function HeroLesCard({
  les,
  label,
  metaText,
  milestoneLabel,
  emptyTitle,
  emptySub,
  emptyCtaLabel,
  emptyCtaTo,
}: HeroLesCardProps) {
  const [weer, setWeer] = useState<DagWeer | null>(null)

  useEffect(() => {
    if (!les) {
      setWeer(null)
      return
    }
    let cancelled = false
    haalWeerVoorDatum(les.datum).then((w) => {
      if (!cancelled) setWeer(w)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [les?.datum])

  if (!les) {
    return (
      <div className="card flex flex-col items-start gap-3 px-5 py-5">
        <div>
          <p className="font-semibold text-slate-800">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptySub}</p>
        </div>
        <Link to={emptyCtaTo} className="btn-primary">
          <CalendarPlusIcon className="h-4 w-4 flex-none" />
          {emptyCtaLabel}
        </Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <p className="px-5 pt-4 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">{label}</p>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl bg-brand-blue text-white">
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-85">{dagAfkorting(les.datum)}</span>
          <span className="text-xl font-extrabold leading-none">{dagNummer(les.datum)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800">
            {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} uur
          </p>
          {metaText && <p className="text-sm text-slate-500">{metaText}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <DisciplineBadge discipline={les.discipline} />
            <span className={`badge ${STATUS_STYLES[les.status]}`}>{STATUS_LABELS[les.status]}</span>
            {milestoneLabel && (
              <span className="relative inline-flex">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-brand-yellow-dark animate-ring-pulse"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border-2 border-brand-yellow-dark animate-ring-pulse [animation-delay:200ms]"
                />
                <span className="badge relative bg-brand-yellow text-brand-blue-dark animate-milestone-pop">
                  🎉 {milestoneLabel}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-brand-blue-light/10 px-5 py-2.5 text-sm font-semibold text-brand-blue-dark">
        {weer && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">💨</span>
            {weer.windBft} Bft {weer.windRichting}
          </span>
        )}
        <span>{countdownLabel(les.datum)}</span>
      </div>
    </div>
  )
}
