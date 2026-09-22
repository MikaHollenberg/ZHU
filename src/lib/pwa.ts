// Platform- en install-status-detectie voor de PWA-installatiebanner
// (zie InstallAppBanner.tsx). Geen enkele browser geeft dit rechtstreeks
// door, dus dit blijft altijd een combinatie van user-agent-sniffing en de
// display-mode media query.
export function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isAppleMobiel = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ geeft zich in de user-agent uit voor een Mac, maar heeft
  // (anders dan een echte Mac) meerdere touch-points.
  const isIpadAlsMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return isAppleMobiel || isIpadAlsMac
}

// Andere iOS-browsers draaien onder de motorkap ook op Safari's engine, maar
// "Zet op beginscherm" werkt daar niet vanuit hun eigen deelmenu — vandaar
// dit onderscheid, puur op basis van hun eigen user-agent-token.
export function isIosSafari(): boolean {
  if (!isIos()) return false
  const ua = window.navigator.userAgent
  return !/crios|fxios|edgios|opios|mercury|duckduckgo/i.test(ua)
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}
