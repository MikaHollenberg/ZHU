import { useEffect, useState } from 'react'
import { isIos, isStandalone } from '../lib/pwa'
import { ShareIcon, XIcon } from './icons'

const DISMISS_KEY = 'zhu_pwa_install_dismissed_tot'
const DISMISS_DAGEN = 7

// Chrome/Android leveren dit event zelf niet als type in lib.dom — vandaar
// deze kleine eigen typering voor wat we er daadwerkelijk van gebruiken.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

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
  const [tonen, setTonen] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    // iOS krijgt nooit een beforeinstallprompt-event — daar tonen we de
    // handmatige "Zet op beginscherm"-uitleg altijd (zolang niet gedismissed).
    if (isIos()) {
      setIos(true)
      setTonen(true)
      return
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setTonen(true)
    }
    const onInstalled = () => {
      setTonen(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!tonen) return null

  const handleSluiten = () => {
    setTonen(false)
    bewaarDismiss()
  }

  const handleInstalleren = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setTonen(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-30 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96">
      <div className="card flex items-start gap-3 p-4 shadow-lg animate-toast-in">
        <img src="/icon-192.png" alt="" className="h-10 w-10 flex-none rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Installeer ZHU Zeilles</p>
          {ios ? (
            <p className="mt-0.5 text-sm text-slate-600">
              Tik op <ShareIcon className="mx-0.5 inline-block h-4 w-4 align-text-bottom text-brand-blue" />{' '}
              (<span className="font-medium">delen</span>) onderin Safari en kies{' '}
              <span className="font-semibold">"Zet op beginscherm"</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-600">
              Voeg het portal toe aan je startscherm voor snelle toegang, net als een echte app.
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-3">
            {!ios && (
              <button type="button" onClick={handleInstalleren} className="btn-primary px-3.5 py-1.5 text-sm">
                Installeren
              </button>
            )}
            <button
              type="button"
              onClick={handleSluiten}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 hover:underline"
            >
              Niet nu
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSluiten}
          aria-label="Sluiten"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
