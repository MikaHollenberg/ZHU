import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/profile'

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <div className="text-slate-500">Laden...</div>
  }

  if (profile?.rol !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
