import { useEffect, useState } from 'react'
import { isIos, isIosSafari, isStandalone } from '../lib/pwa'
import { ShareIcon, XIcon } from './icons'

const DISMISS_KEY = 'zhu_pwa_install_dismissed_tot'
const DISMISS_DAGEN = 7

// Chrome/Android leveren dit event zelf niet als type in lib.dom — vandaar
// deze kleine eigen typering voor wat we er daadwerkelijk van gebruiken.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Variant = 'ios-safari' | 'ios-anders' | 'android'

function isDismissed(): boolean {
  try {
    const tot = window.localStorage.getItem(DISMISS_KEY)
    return tot !== null && Date.now() < Number(tot)
  } catch {
    return false
  }
}

function bewaarDismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAGEN * 24 * 60 * 60 * 1000))
  } catch {
    // Privénavigatie o.i.d. — dan verschijnt de banner gewoon opnieuw bij een volgend bezoek, niet erg.
  }
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    // iOS krijgt nooit een beforeinstallprompt-event — daar tonen we altijd
    // de handmatige uitleg (welke, hangt af van Safari of een andere browser).
    if (isIos()) {
      setVariant(isIosSafari() ? 'ios-safari' : 'ios-anders')
      return
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVariant('android')
    }
    const onInstalled = () => {
      setVariant(null)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!variant) return null

  const sluiten = () => {
    setVariant(null)
    bewaarDismiss()
  }

  const handleInstalleren = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVariant(null)
  }

  return (
    // Alleen op telefoonformaat (sm:hidden) — op desktop hoeft deze niet te
    // komen, ook niet als Chrome daar toevallig ook een beforeinstallprompt geeft.
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:hidden"
      onClick={sluiten}
    >
      <div
        className="w-full max-w-md animate-toast-in rounded-t-3xl bg-white p-5 shadow-2xl"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <span
            className={`badge ${
              variant === 'ios-anders'
                ? 'bg-status-wachtend-bg text-status-wachtend'
                : 'bg-brand-blue-light/25 text-brand-blue-dark'
            }`}
          >
            {variant === 'ios-anders' ? 'Alleen via Safari' : 'Aanbevolen · niet verplicht'}
          </span>
          <button
            type="button"
            onClick={sluiten}
            aria-label="Sluiten"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3.5 flex gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-brand-blue-dark text-2xl">
            ⛵
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800">
              {variant === 'android' ? 'Zet ZHU Zeilles op je startscherm' : 'Zet dit portal op je beginscherm'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Handig, maar zeker geen must — je opent het portal dan net zo snel als een gewone app.
            </p>
          </div>
        </div>

        {variant === 'ios-safari' && (
          <div className="mb-3.5 flex items-start gap-2.5 rounded-2xl bg-brand-blue-light/10 p-3.5">
            <ShareIcon className="h-5 w-5 flex-none text-brand-blue-dark" />
            <p className="text-sm text-slate-700">
              Tik in <strong>Safari</strong> op het deel-icoon in de werkbalk, en kies daarna{' '}
              <strong>"Zet op beginscherm"</strong>.
            </p>
          </div>
        )}

        {variant === 'ios-anders' && (
          <div className="mb-3.5 flex items-start gap-2.5 rounded-2xl border border-status-wachtend/25 bg-status-wachtend-bg p-3.5">
            <span aria-hidden="true" className="text-base leading-none">
              ⚠️
            </span>
            <p className="text-sm text-status-wachtend">
              <strong>Let op:</strong> dit werkt alleen via Safari. Open deze link in Safari om er een webapp van te
              maken.
            </p>
          </div>
        )}

        {variant === 'android' ? (
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleInstalleren} className="btn-primary flex-1">
              Installeren
            </button>
            <button
              type="button"
              onClick={sluiten}
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 hover:underline"
            >
              Niet nu
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={sluiten}
            className="w-full rounded-full bg-brand-blue-light/15 py-3 text-sm font-bold text-brand-blue-dark transition-colors duration-150 hover:bg-brand-blue-light/25"
          >
            Begrepen
          </button>
        )}
      </div>
    </div>
  )
}
