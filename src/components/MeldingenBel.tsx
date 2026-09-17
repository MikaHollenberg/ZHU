import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { tijdGeleden } from '../lib/datum'
import type { Melding, MeldingType } from '../types/melding'
import {
  BellIcon,
  CalendarIcon,
  CalendarPlusIcon,
  ClockIcon,
  CompassIcon,
  DotIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
} from './icons'

const TYPE_ICONS: Record<MeldingType, (props: { className?: string }) => ReactElement> = {
  nieuwe_registratie: UsersIcon,
  nieuwe_beschikbaarheid: CalendarIcon,
  les_ingepland: CalendarPlusIcon,
  les_verzet: ClockIcon,
  les_geannuleerd: XIcon,
  instructeur_aanvraag: CompassIcon,
}

export function MeldingenBel({
  meldingen,
  ongelezenAantal,
  onOpen,
  onMarkeer,
  onVerwijder,
  align = 'left',
}: {
  meldingen: Melding[]
  ongelezenAantal: number
  onOpen?: () => void
  onMarkeer: (id: string, gelezen: boolean) => void
  onVerwijder: (id: string) => void
  /** Waar het paneel t.o.v. de bel opent — 'left' voor de zijbalk, 'right' voor de mobiele topbalk. */
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  const toggle = () => {
    const volgende = !open
    setOpen(volgende)
    if (volgende) onOpen?.()
  }

  const handleRowClick = (melding: Melding) => {
    if (!melding.gelezen) onMarkeer(melding.id, true)
    setOpen(false)
    if (melding.link) navigate(melding.link)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ongelezenAantal > 0 ? `Meldingen, ${ongelezenAantal} ongelezen` : 'Meldingen'}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-brand-blue-light/90 transition-colors duration-150 hover:bg-white/10 hover:text-white"
      >
        <BellIcon className="h-5 w-5" />
        {ongelezenAantal > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-geannuleerd px-1 text-[9px] font-bold leading-none text-white">
            {ongelezenAantal > 9 ? '9+' : ongelezenAantal}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="region"
          aria-label="Meldingen"
          className={`absolute top-11 z-30 max-h-[70vh] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Meldingen</p>
            {ongelezenAantal > 0 && (
              <button
                type="button"
                onClick={() => meldingen.filter((m) => !m.gelezen).forEach((m) => onMarkeer(m.id, true))}
                className="text-xs font-medium text-brand-blue-dark hover:underline"
              >
                Alles gelezen
              </button>
            )}
          </div>

          <div className="max-h-[calc(70vh-44px)] overflow-y-auto">
            {meldingen.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Geen meldingen</p>
            ) : (
              <ul>
                {meldingen.map((melding) => {
                  const Icon = TYPE_ICONS[melding.type] ?? BellIcon
                  return (
                    <li key={melding.id} className="border-b border-slate-50 last:border-b-0">
                      <div
                        className={`group flex items-start gap-2.5 px-4 py-3 transition-colors duration-150 hover:bg-brand-blue-light/10 ${
                          melding.gelezen ? '' : 'bg-brand-blue-light/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleRowClick(melding)}
                          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                        >
                          <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-blue-light/25 text-brand-blue-dark">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className={`truncate text-sm ${melding.gelezen ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                                {melding.titel}
                              </span>
                              {!melding.gelezen && <DotIcon className="h-1.5 w-1.5 flex-none text-brand-blue" />}
                            </span>
                            {melding.omschrijving && (
                              <span className="mt-0.5 block text-xs text-slate-500">{melding.omschrijving}</span>
                            )}
                            <span className="mt-1 block text-[11px] text-slate-400">{tijdGeleden(melding.aangemaakt_op)}</span>
                          </span>
                        </button>
                        <div className="flex flex-none flex-col items-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => onMarkeer(melding.id, !melding.gelezen)}
                            title={melding.gelezen ? 'Markeer als ongelezen' : 'Markeer als gelezen'}
                            aria-label={melding.gelezen ? 'Markeer als ongelezen' : 'Markeer als gelezen'}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-blue-dark"
                          >
                            <DotIcon className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onVerwijder(melding.id)}
                            title="Verwijderen"
                            aria-label="Melding verwijderen"
                            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
