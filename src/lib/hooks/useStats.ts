import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { getUserStats, recordFactLearned } from '@/lib/api/stats'

export function useStats() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['stats', user?.id] as const

  const query = useQuery({
    queryKey,
    queryFn: () => getUserStats(user!.id),
    enabled: Boolean(user),
  })

  async function recordLearned() {
    if (!user) return
    const next = await recordFactLearned(user.id)
    queryClient.setQueryData(queryKey, next)
  }

  return { stats: query.data ?? null, isLoading: query.isLoading, recordLearned }
}
