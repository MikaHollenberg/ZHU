import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinkClass = 'text-brand-blue hover:text-brand-blue-dark'

  const navLinks = !profile?.gearchiveerd && (
    <>
      {profile?.rol === 'beheerder' ? (
        <>
          <Link to="/beheer/cursisten" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Cursisten
          </Link>
          <Link to="/beheer/beschikbaarheid" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Rooster
          </Link>
          <Link to="/beheer/labels" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Labels
          </Link>
        </>
      ) : profile?.rol === 'instructeur' ? (
        <>
          <Link to="/beschikbaarheid" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Beschikbaarheid
          </Link>
          <Link to="/lesgeven" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Lesgeven
          </Link>
        </>
      ) : (
        <>
          <Link to="/beschikbaarheid" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Beschikbaarheid
          </Link>
          <Link to="/mijn-lessen" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Mijn lessen
          </Link>
        </>
      )}
      <Link to="/profiel" className={navLinkClass} onClick={() => setMenuOpen(false)}>
        Mijn gegevens
      </Link>
    </>
  )

  return (
    <div className="min-h-screen bg-brand-blue-light/15">
      <header className="border-b border-brand-blue-light/40 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-brand-blue-dark"
            onClick={() => setMenuOpen(false)}
          >
            <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
            ZHU Zeilles
          </Link>

          {session && (
            <>
              <nav className="hidden items-center gap-4 text-sm sm:flex">
                {navLinks}
                {profile && (
                  <span className="text-slate-400">
                    {profile.voornaam} {profile.achternaam}
                  </span>
                )}
                <button type="button" onClick={handleLogout} className="btn-accent">
                  Uitloggen
                </button>
              </nav>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-md text-brand-blue-dark sm:hidden"
              >
                {menuOpen ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        {session && menuOpen && (
          <nav className="flex flex-col gap-3 border-t border-brand-blue-light/40 px-4 py-4 text-sm sm:hidden">
            {navLinks}
            {profile && (
              <span className="text-slate-400">
                {profile.voornaam} {profile.achternaam}
              </span>
            )}
            <button type="button" onClick={handleLogout} className="btn-accent w-fit">
              Uitloggen
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <footer className="border-t border-brand-blue-light/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4">
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
    </div>
  )
}
