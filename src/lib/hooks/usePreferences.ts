import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { getUserPreferences, saveUserPreferences } from '@/lib/api/preferences'
import type { Domain } from '@/lib/types'

export function usePreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['preferences', user?.id] as const

  const query = useQuery({
    queryKey,
    queryFn: () => getUserPreferences(user!.id),
    enabled: Boolean(user),
  })

  const mutation = useMutation({
    mutationFn: (domains: Domain[]) => saveUserPreferences(user!.id, domains),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated)
    },
  })

  return {
    preferences: query.data ?? null,
    isLoading: query.isLoading,
    savePreferences: mutation.mutateAsync,
    isSaving: mutation.isPending,
  }
}
