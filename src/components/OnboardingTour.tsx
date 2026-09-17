import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { ChevronRightIcon } from './icons'

export type TourStep = {
  title: string
  body: string
  /** id van het echte schermdeel dat gemarkeerd wordt — leeg = geen spotlight, alleen een gedimd scherm. */
  targetId?: string
  icon: (props: { className?: string }) => ReactElement
}

export function OnboardingTour({
  steps,
  step,
  onNext,
  onPrev,
  onSkip,
}: {
  steps: TourStep[]
  step: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const current = steps[step]

  useEffect(() => {
    if (!current.targetId) {
      setRect(null)
      return
    }
    const el = document.getElementById(current.targetId)
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const update = () => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    // Twee metingen: direct (voorkomt een lege flits) en nogmaals ná de smooth-scroll.
    update()
    const timer = window.setTimeout(update, 400)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [current.targetId])

  useEffect(() => {
    nextButtonRef.current?.focus()
  }, [step])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  return (
    <div role="dialog" aria-modal="true" aria-label="Rondleiding beschikbaarheid">
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-40 rounded-2xl transition-all duration-300 ease-out animate-spotlight-pulse"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-slate-900/60 transition-opacity duration-200" />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
        <div className="card mx-3 mb-3 space-y-4 p-6 animate-toast-in sm:mx-0 sm:mb-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-blue-light/30 text-brand-blue-dark">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold leading-snug text-slate-800">{current.title}</h2>
          </div>

          <p className="text-base leading-relaxed text-slate-600">{current.body}</p>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                  i <= step ? 'bg-brand-blue' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Stap {step + 1} van {steps.length}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="text-base font-semibold text-slate-500 transition-colors hover:text-slate-700"
              >
                Vorige
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="text-base text-slate-400 transition-colors hover:text-slate-600 hover:underline"
            >
              Sla over
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              onClick={onNext}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-blue-dark active:scale-[0.98]"
            >
              {isLast ? 'Begrepen' : 'Volgende'}
              {!isLast && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
