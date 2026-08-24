import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-brand-blue-light/15">
      <header className="border-b border-brand-blue-light/40 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-brand-blue-dark">
            ZHU Zeilles
          </Link>
          {session && (
            <nav className="flex items-center gap-4 text-sm">
              {profile?.rol === 'beheerder' ? (
                <>
                  <Link to="/beheer/cursisten" className="text-brand-blue hover:text-brand-blue-dark">
                    Cursisten
                  </Link>
                  <Link to="/beheer/beschikbaarheid" className="text-brand-blue hover:text-brand-blue-dark">
                    Rooster
                  </Link>
                  <Link to="/beheer/labels" className="text-brand-blue hover:text-brand-blue-dark">
                    Labels
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/beschikbaarheid" className="text-brand-blue hover:text-brand-blue-dark">
                    Beschikbaarheid
                  </Link>
                  <Link to="/mijn-lessen" className="text-brand-blue hover:text-brand-blue-dark">
                    Mijn lessen
                  </Link>
                </>
              )}
              <Link to="/profiel" className="text-brand-blue hover:text-brand-blue-dark">
                Mijn gegevens
              </Link>
              {profile && (
                <span className="text-slate-400">
                  {profile.voornaam} {profile.achternaam}
                </span>
              )}
              <button type="button" onClick={handleLogout} className="btn-accent">
                Uitloggen
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}
