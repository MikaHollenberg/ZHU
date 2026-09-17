import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/profile'
import { Loader } from './Loader'

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (profile?.rol !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
