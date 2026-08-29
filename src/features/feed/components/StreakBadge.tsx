import { Flame } from 'lucide-react'

import { useLocale } from '@/lib/i18n/LocaleContext'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { t } = useLocale()
  if (streak <= 0) return null

  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-body-sm font-semibold text-foreground">
      <Flame size={16} className="text-ember" />
      {streak} {streak === 1 ? t('streak.dayLabel') : t('streak.daysLabel')}
    </div>
  )
}
