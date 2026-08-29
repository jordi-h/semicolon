import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthPage } from '@/features/auth/AuthPage'
import { FeedPage } from '@/features/feed/FeedPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { SavedPage } from '@/features/saved/SavedPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

function App() {
  return (
    <div className="h-dvh w-full bg-muted/30 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="mx-auto h-full w-full sm:h-[calc(100dvh-3rem)] sm:max-w-md">
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
