import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
      <Flame size={16} className="text-orange-400" />
      {streak} day{streak === 1 ? '' : 's'}
    </div>
  )
}
