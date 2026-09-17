import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from './icons'
import type { TourStep } from '../lib/tourSteps'

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
  const location = useLocation()
  const navigate = useNavigate()
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const current = steps[step]

  // Elke stap hoort bij een route — sta je nog op de vorige pagina, dan navigeert
  // de rondleiding er zelf naartoe. Zodra location.pathname klopt, loopt dit
  // effect opnieuw en gaat het door naar het meten van de spotlight hieronder.
  useEffect(() => {
    if (current.route && location.pathname !== current.route) {
      navigate(current.route)
      return
    }

    if (!current.targetId) {
      setRect(null)
      return
    }
    const el = document.getElementById(current.targetId)
    if (!el || el.offsetParent === null) {
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
  }, [current.route, current.targetId, location.pathname, navigate])

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

  // Op de verkeerde pagina staan we hier nog even te wachten tot de navigatie
  // hierboven is verwerkt — niets te tonen in die ene tussenrender.
  if (current.route && location.pathname !== current.route) {
    return null
  }

  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  return (
    <div role="dialog" aria-modal="true" aria-label="Rondleiding">
      {rect ? (
        <div
          key={`spot-${step}`}
          aria-hidden="true"
          className="pointer-events-none fixed z-40 rounded-2xl transition-all duration-300 ease-out animate-spotlight-pulse"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-slate-900/60 transition-opacity duration-200" />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
        <div
          key={step}
          className="card mx-3 mb-3 max-h-[38vh] space-y-2.5 overflow-y-auto p-4 animate-toast-in sm:mx-0 sm:mb-0 sm:max-h-none sm:space-y-4 sm:overflow-visible sm:p-6"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-blue-light/30 text-brand-blue-dark sm:h-11 sm:w-11">
              <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
            </span>
            <h2 className="text-base font-bold leading-snug text-slate-800 sm:text-xl">{current.title}</h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{current.body}</p>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 sm:h-1.5 ${
                  i <= step ? 'bg-brand-blue' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Stap {step + 1} van {steps.length}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 sm:gap-x-4 sm:gap-y-2 sm:pt-1">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 sm:text-base"
              >
                Vorige
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-400 transition-colors hover:text-slate-600 hover:underline sm:text-base"
            >
              Sla over
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              onClick={onNext}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-blue-dark active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
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
