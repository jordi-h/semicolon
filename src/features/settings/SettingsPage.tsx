import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookHeart, Flame, LogOut, Sparkles, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS } from '@/lib/types'
import { usePreferences } from '@/lib/hooks/usePreferences'
import { useStats } from '@/lib/hooks/useStats'

export function SettingsPage() {
  const { user, authRequired, signOut } = useAuth()
  const { preferences } = usePreferences()
  const { stats } = useStats()
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
          aria-label="Back to feed"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Profile & settings</h1>
      </div>

      {authRequired && user?.email && (
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      )}

      <section className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="text-orange-500" />}
          label="Current streak"
          value={stats?.currentStreak ?? 0}
        />
        <StatCard
          icon={<Trophy className="text-yellow-500" />}
          label="Best streak"
          value={stats?.longestStreak ?? 0}
        />
        <StatCard
          icon={<Sparkles className="text-primary" />}
          label="Facts learned"
          value={stats?.factsLearned ?? 0}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Your topics</h2>
        <div className="flex flex-wrap gap-2">
          {(preferences?.domains ?? []).map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
            >
              <span aria-hidden="true">{DOMAIN_EMOJI[domain]}</span>
              {DOMAIN_LABELS[domain]}
            </span>
          ))}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/onboarding">Edit topics</Link>
        </Button>
      </section>

      <section>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link to="/saved">
            <BookHeart size={18} />
            Saved facts
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
          Sign out
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
        <span className="text-xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
