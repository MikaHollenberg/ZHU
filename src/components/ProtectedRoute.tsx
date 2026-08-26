import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        Laden...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.gearchiveerd) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-brand-blue-dark">Account gearchiveerd</h1>
        <p className="text-slate-600">
          Je account is gearchiveerd. Neem contact op met de zeilschool om je account weer te activeren.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
