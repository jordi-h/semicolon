import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DomainPicker } from '@/features/onboarding/components/DomainPicker'
import { usePreferences } from '@/lib/hooks/usePreferences'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Domain } from '@/lib/types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { preferences, isLoading, savePreferences, isSaving } = usePreferences()
  // locale falls back to the current UI locale (e.g. guest/browser-detected)
  // for a first-time save, when there's no saved preference yet to read it from.
  const { locale, t } = useLocale()
  const [selected, setSelected] = useState<Domain[]>([])
  const isEditing = Boolean(preferences)

  useEffect(() => {
    if (preferences) setSelected(preferences.domains)
  }, [preferences])

  async function handleContinue() {
    await savePreferences(selected, preferences?.locale ?? locale)
    navigate(isEditing ? '/settings' : '/feed')
  }

  if (isLoading) return null

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          {isEditing ? t('onboarding.titleEdit') : t('onboarding.titleNew')}
        </h1>
        <p className="text-muted-foreground">{t('onboarding.subtitle')}</p>
      </div>

      <DomainPicker selected={selected} onChange={setSelected} />

      <Button
        size="lg"
        disabled={selected.length === 0 || isSaving}
        onClick={handleContinue}
        className="mt-2"
      >
        {isSaving
          ? t('onboarding.saving')
          : isEditing
            ? t('onboarding.saveChanges')
            : t('onboarding.startScrolling')}
      </Button>
    </div>
  )
}
