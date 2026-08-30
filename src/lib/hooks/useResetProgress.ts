import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { resetProgress, type ResetScope } from '@/lib/api/resetProgress'

/** Query key prefixes that mirror per-user progress and so must be
 * refetched after a reset. Prefix matching means ['stats'] invalidates
 * ['stats', userId].
 *
 * 'facts' is deliberately absent: the fact pool is content, not
 * progress, and refetching 2,200 rows after a reset would be a pointless
 * round trip. */
const PROGRESS_QUERY_PREFIXES = [
  ['seen-facts'],
  ['domain-affinity'],
  ['tag-affinity'],
  ['stats'],
  ['saved-facts'],
  ['saved-facts-content'],
] as const

export function useResetProgress() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (scope: ResetScope) => resetProgress(user!.id, scope),
    onSuccess: async () => {
      await Promise.all(
        PROGRESS_QUERY_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    },
  })

  return {
    reset: mutation.mutateAsync,
    isResetting: mutation.isPending,
    resetFailed: mutation.isError,
  }
}
