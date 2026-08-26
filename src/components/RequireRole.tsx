import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/profile'

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        Laden...
      </div>
    )
  }

  if (profile?.rol !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
