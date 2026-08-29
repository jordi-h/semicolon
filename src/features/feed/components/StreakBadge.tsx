import { Flame } from 'lucide-react'

import { useLocale } from '@/lib/i18n/LocaleContext'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { t } = useLocale()
  if (streak <= 0) return null

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
      <Flame size={16} className="text-orange-400" />
      {streak} {streak === 1 ? t('streak.dayLabel') : t('streak.daysLabel')}
    </div>
  )
}
