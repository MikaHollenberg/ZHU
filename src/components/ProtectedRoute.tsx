import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Laden...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.gearchiveerd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-brand-blue-dark">Account gearchiveerd</h1>
        <p className="text-slate-600">
          Je account is gearchiveerd. Neem contact op met de zeilschool om je account weer te activeren.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
