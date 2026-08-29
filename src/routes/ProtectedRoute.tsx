import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/features/auth/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, authRequired } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (authRequired && !user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
