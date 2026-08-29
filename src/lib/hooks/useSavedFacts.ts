import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { fetchFactsByIds } from '@/lib/api/facts'
import { getSavedFacts, saveFact, unsaveFact } from '@/lib/api/savedFacts'
import { useLocale } from '@/lib/i18n/LocaleContext'

export function useSavedFacts() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const savedIdsKey = ['saved-facts', user?.id] as const

  const savedQuery = useQuery({
    queryKey: savedIdsKey,
    queryFn: () => getSavedFacts(user!.id),
    enabled: Boolean(user),
  })

  const savedIds = new Set((savedQuery.data ?? []).map((s) => s.factId))

  const factsQuery = useQuery({
    queryKey: ['saved-facts-content', [...savedIds].sort().join(','), locale],
    queryFn: () => fetchFactsByIds([...savedIds], locale),
    enabled: savedQuery.isSuccess,
  })

  const savedByDate = new Map((savedQuery.data ?? []).map((s) => [s.factId, s.savedAt]))
  const savedFacts = (factsQuery.data ?? [])
    .map((fact) => ({ fact, savedAt: savedByDate.get(fact.id) ?? '' }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))

  const saveMutation = useMutation({
    mutationFn: (factId: string) => saveFact(user!.id, factId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedIdsKey }),
  })

  const unsaveMutation = useMutation({
    mutationFn: (factId: string) => unsaveFact(user!.id, factId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedIdsKey }),
  })

  return {
    savedIds,
    savedFacts,
    isLoading: savedQuery.isLoading || factsQuery.isLoading,
    save: saveMutation.mutateAsync,
    unsave: unsaveMutation.mutateAsync,
    toggle: (factId: string) =>
      savedIds.has(factId) ? unsaveMutation.mutateAsync(factId) : saveMutation.mutateAsync(factId),
  }
}
