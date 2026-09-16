import { useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PAGE_TITLES } from '../lib/pageTitles'
import {
  BookIcon,
  CalendarIcon,
  ChartBarIcon,
  CompassIcon,
  LogoutIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from './icons'

type NavItem = {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  /** Deze nav-item toont een teller als er iets op actie wacht (zie pendingCount). */
  showBadge?: boolean
}

const ROLE_LABELS: Record<string, string> = {
  cursist: 'Cursist',
  instructeur: 'Instructeur',
  beheerder: 'Beheerder',
}

function navItemsForRole(rol: string | undefined): NavItem[] {
  if (rol === 'beheerder') {
    return [
      { to: '/beheer/cursisten', label: 'Cursisten', icon: UsersIcon },
      { to: '/beheer/beschikbaarheid', label: 'Rooster', icon: CalendarIcon, showBadge: true },
      { to: '/beheer/labels', label: 'Labels', icon: TagIcon },
      { to: '/beheer/statistieken', label: 'Statistieken', icon: ChartBarIcon },
    ]
  }
  if (rol === 'instructeur') {
    return [
      { to: '/beschikbaarheid', label: 'Beschikbaarheid', icon: CalendarIcon },
      { to: '/lesgeven', label: 'Lesgeven', icon: CompassIcon, showBadge: true },
      { to: '/statistieken', label: 'Statistieken', icon: ChartBarIcon },
    ]
  }
  return [
    { to: '/beschikbaarheid', label: 'Beschikbaarheid', icon: CalendarIcon },
    { to: '/mijn-lessen', label: 'Mijn lessen', icon: BookIcon },
  ]
}

const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex transform items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold transition-all duration-200 ${
    isActive
      ? 'bg-brand-blue text-white shadow-sm'
      : 'text-brand-blue-light/90 hover:translate-x-0.5 hover:bg-white/10 hover:text-white'
  }`

const mobileTabClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10.5px] font-semibold transition-colors duration-150 ${
    isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-brand-blue-dark'
  }`

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-brand-blue focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-white focus-visible:shadow-lg"
    >
      Spring naar inhoud
    </a>
  )
}

function NavBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} openstaand`}
      className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-geannuleerd px-1 text-[9px] font-bold leading-none text-white"
    >
      {count}
    </span>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { session, user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const avatarMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setAvatarMenuOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Documenttitel per pagina (#7) — centraal hier i.p.v. in elke pagina apart.
  useEffect(() => {
    const naam = PAGE_TITLES[location.pathname]
    document.title = naam ? `${naam} — ZHU Zeilles` : 'ZHU Zeilles'
  }, [location.pathname])

  // Teller voor "wacht op actie" (#5): beheerder ziet openstaande instructeur-
  // aanvragen, instructeur ziet zijn eigen aanvragen die nog goedkeuring nodig hebben.
  useEffect(() => {
    if (!user || !profile || profile.gearchiveerd) {
      setPendingCount(0)
      return
    }
    let cancelled = false
    const fetchPending = async () => {
      if (profile.rol === 'beheerder') {
        const { count } = await supabase
          .from('lessen')
          .select('id', { count: 'exact', head: true })
          .not('instructeur_aanvraag_id', 'is', null)
          .is('instructeur_id', null)
        if (!cancelled) setPendingCount(count ?? 0)
      } else if (profile.rol === 'instructeur') {
        const { count } = await supabase
          .from('lessen')
          .select('id', { count: 'exact', head: true })
          .eq('instructeur_aanvraag_id', user.id)
          .is('instructeur_id', null)
        if (!cancelled) setPendingCount(count ?? 0)
      } else {
        setPendingCount(0)
      }
    }
    fetchPending()
    return () => {
      cancelled = true
    }
  }, [user, profile, location.pathname])

  // Mobiel accountmenu (#3): Escape sluit het en zet focus terug op de knop,
  // en een klik buiten het menu sluit het ook.
  useEffect(() => {
    if (!avatarMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAvatarMenuOpen(false)
        avatarButtonRef.current?.focus()
      }
    }
    const onClickOutside = (event: MouseEvent) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target as Node) &&
        !avatarButtonRef.current?.contains(event.target as Node)
      ) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [avatarMenuOpen])

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-brand-blue-light/15">
        <SkipLink />
        <header className="border-b border-brand-blue-light/40 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-brand-blue-dark">
              <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
              ZHU Zeilles
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </div>
    )
  }

  const archived = Boolean(profile?.gearchiveerd)
  const primaryNav = archived ? [] : navItemsForRole(profile?.rol)
  const profileItem: NavItem = { to: '/profiel', label: 'Mijn gegevens', icon: UserIcon }
  const navItems = archived ? [] : [...primaryNav, profileItem]

  const initials = profile ? `${profile.voornaam?.[0] ?? ''}${profile.achternaam?.[0] ?? ''}`.toUpperCase() : ''
  const roleLabel = profile?.rol ? ROLE_LABELS[profile.rol] ?? profile.rol : ''

  return (
    <div className="min-h-screen bg-brand-blue-light/10 sm:flex">
      <SkipLink />

      {/* Desktop zijbalk */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col gap-5 bg-gradient-to-b from-sidebar to-sidebar-deep px-3.5 py-5 sm:flex">
        <Link to="/" className="flex items-center gap-2.5 border-b border-white/10 px-2 pb-4 text-white">
          <img src="/logo-mark.png" alt="" className="h-7 w-7 flex-shrink-0 object-contain" />
          <span className="text-sm font-semibold leading-tight">
            ZHU Zeilles
            <span className="block text-[10px] font-medium text-brand-blue-light/70">Priveles-portal</span>
          </span>
        </Link>

        <nav aria-label="Hoofdnavigatie" className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const badge = item.showBadge && pendingCount > 0 ? pendingCount : undefined
            return (
              <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badge !== undefined && (
                  <span
                    aria-label={`${badge} openstaand`}
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-status-geannuleerd px-1.5 text-[10px] font-bold text-white"
                  >
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {profile && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2.5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-yellow text-xs font-extrabold text-sidebar">
                {initials || '?'}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[12.5px] font-bold text-white">
                  {profile.voornaam} {profile.achternaam}
                </span>
                <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-brand-blue-light/60">
                  {roleLabel}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[12.5px] font-semibold text-brand-blue-light/90 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-[15px] w-[15px]" />
              Uitloggen
            </button>
          </div>
        )}
      </aside>

      {/* Mobiele topbalk — logo + accountmenu (navigatie zelf staat in de onderbalk) */}
      <header className="sticky top-0 z-20 border-b border-brand-blue-light/40 bg-white shadow-sm sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-brand-blue-dark">
            <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
            ZHU Zeilles
          </Link>
          {profile && (
            <div className="relative">
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setAvatarMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={avatarMenuOpen}
                aria-label="Accountmenu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-xs font-extrabold text-brand-blue-dark"
              >
                {initials || '?'}
              </button>
              {avatarMenuOpen && (
                <div
                  ref={avatarMenuRef}
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {profile.voornaam} {profile.achternaam}
                  </p>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">{roleLabel}</p>
                  <button type="button" role="menuitem" onClick={handleLogout} className="btn-accent w-full">
                    <LogoutIcon className="h-4 w-4" />
                    Uitloggen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col pb-16 sm:pb-0">
        <main id="main-content" tabIndex={-1} className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </div>

      {/* Mobiele onderbalk — vervangt het oude hamburgermenu */}
      {navItems.length > 0 && (
        <nav
          aria-label="Hoofdnavigatie"
          className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-brand-blue-light/40 bg-white px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(15,55,77,0.08)] sm:hidden"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const badge = item.showBadge && pendingCount > 0 ? pendingCount : undefined
            return (
              <NavLink key={item.to} to={item.to} className={mobileTabClass}>
                <Icon className="h-5 w-5" />
                {item.to === '/profiel' ? 'Profiel' : item.label}
                {badge !== undefined && <NavBadge count={badge} />}
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-brand-blue-light/40 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4">
        <img src="/logo-horizontaal.png" alt="Zeilschool Het Uitgeestermeer" className="h-8 w-auto opacity-70" />
        <div className="flex gap-4 text-xs text-slate-400">
          <Link to="/algemene-voorwaarden" className="hover:text-slate-600 hover:underline">
            Algemene voorwaarden
          </Link>
          <Link to="/privacybeleid" className="hover:text-slate-600 hover:underline">
            Privacybeleid
          </Link>
        </div>
      </div>
    </footer>
  )
}
