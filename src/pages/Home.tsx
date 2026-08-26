import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Les } from '../types/lesson'

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function Home() {
  const { user, profile } = useAuth()
  const [toekomstig, setToekomstig] = useState<Les[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || profile?.rol !== 'cursist') {
      setLoading(false)
      return
    }
    const vandaag = new Date().toISOString().slice(0, 10)
    supabase
      .from('lessen')
      .select('*')
      .eq('cursist_id', user.id)
      .gte('datum', vandaag)
      .neq('status', 'geannuleerd')
      .order('datum', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        setToekomstig(data ?? [])
        setLoading(false)
      })
  }, [user, profile])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-brand-blue-dark">
        Welkom{profile ? `, ${profile.voornaam}` : ''}
      </h1>

      {profile?.rol === 'beheerder' ? (
        <div>
          <p className="mb-4 text-slate-600">Je bent ingelogd als beheerder.</p>
          <div className="flex gap-3">
            <Link to="/beheer/cursisten" className="btn-primary">
              Cursisten bekijken
            </Link>
            <Link to="/beheer/beschikbaarheid" className="btn-accent">
              Rooster
            </Link>
          </div>
        </div>
      ) : profile?.rol === 'instructeur' ? (
        <div>
          <p className="mb-4 text-slate-600">Je bent ingelogd als instructeur.</p>
          <div className="flex gap-3">
            <Link to="/lesgeven" className="btn-primary">
              Lesgeven
            </Link>
            <Link to="/beschikbaarheid" className="btn-accent">
              Beschikbaarheid doorgeven
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Toekomstige lessen</h2>
          {loading ? (
            <p className="text-slate-500">Laden...</p>
          ) : toekomstig.length === 0 ? (
            <p className="mb-4 text-slate-600">Nog geen lessen ingepland.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {toekomstig.map((les) => (
                <li key={les.id} className="card px-4 py-3">
                  <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                  <p className="text-sm text-slate-500">
                    {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Link to="/mijn-lessen" className="btn-accent">
              Al mijn lessen
            </Link>
            <Link to="/beschikbaarheid" className="btn-primary">
              Beschikbaarheid doorgeven
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
