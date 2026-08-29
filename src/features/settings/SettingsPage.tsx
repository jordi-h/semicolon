import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookHeart, Flame, Globe, LogOut, Sparkles, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { DOMAIN_ACCENT } from '@/lib/domainTheme'
import { usePreferences } from '@/lib/hooks/usePreferences'
import { useStats } from '@/lib/hooks/useStats'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { cn } from '@/lib/utils'
import { DOMAIN_EMOJI, DOMAIN_LABELS, LOCALES, LOCALE_NATIVE_NAMES } from '@/lib/types'

export function SettingsPage() {
  const { user, authRequired, signOut } = useAuth()
  const { preferences } = usePreferences()
  const { stats } = useStats()
  const { locale, setLocale, t } = useLocale()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-6 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <Link
          to="/feed"
          aria-label={t('settings.backAriaLabel')}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-display-title">{t('settings.title')}</h1>
      </div>

      {authRequired && user?.email && (
        <p className="text-body-sm text-muted-foreground">
          {t('settings.signedInAs', { email: user.email })}
        </p>
      )}

      <section className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="text-ember" />}
          label={t('settings.currentStreak')}
          value={stats?.currentStreak ?? 0}
        />
        <StatCard
          icon={<Trophy className="text-amber-400" />}
          label={t('settings.bestStreak')}
          value={stats?.longestStreak ?? 0}
        />
        <StatCard
          icon={<Sparkles className="text-primary" />}
          label={t('settings.factsLearned')}
          value={stats?.factsLearned ?? 0}
        />
      </section>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-body-md font-semibold">
          <Globe size={16} />
          {t('settings.language')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLocale(option)}
              aria-pressed={locale === option}
              className={cn(
                'rounded-full border px-3 py-1.5 text-body-sm transition-colors',
                locale === option
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'hover:border-muted-foreground/40 hover:bg-secondary/50',
              )}
            >
              {LOCALE_NATIVE_NAMES[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-body-md font-semibold">{t('settings.yourTopics')}</h2>
        <div className="flex flex-wrap gap-2">
          {(preferences?.domains ?? []).map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/60 px-3 py-1 text-body-sm"
              style={{ borderColor: `${DOMAIN_ACCENT[domain]}55` }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: DOMAIN_ACCENT[domain] }}
              />
              <span aria-hidden="true">{DOMAIN_EMOJI[domain]}</span>
              {DOMAIN_LABELS[locale][domain]}
            </span>
          ))}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/onboarding">{t('settings.editTopics')}</Link>
        </Button>
      </section>

      <section>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link to="/saved">
            <BookHeart size={18} />
            {t('settings.savedFacts')}
          </Link>
        </Button>
      </section>

      {authRequired && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive"
          onClick={handleSignOut}
        >
          <LogOut size={18} />
          {t('settings.signOut')}
        </Button>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        {icon}
        <span className="font-display text-xl font-bold">{value}</span>
        <span className="text-label uppercase text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
