import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/features/auth/AuthContext'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

/** Renders a component wrapped in the same provider stack as main.tsx —
 * needed for any component using useAuth/usePreferences/useLocale. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>{ui}</LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}
