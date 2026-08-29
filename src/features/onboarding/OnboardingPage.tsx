import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DomainPicker } from '@/features/onboarding/components/DomainPicker'
import { usePreferences } from '@/lib/hooks/usePreferences'
import type { Domain } from '@/lib/types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { preferences, isLoading, savePreferences, isSaving } = usePreferences()
  const [selected, setSelected] = useState<Domain[]>([])
  const isEditing = Boolean(preferences)

  useEffect(() => {
    if (preferences) setSelected(preferences.domains)
  }, [preferences])

  async function handleContinue() {
    await savePreferences(selected)
    navigate(isEditing ? '/settings' : '/feed')
  }

  if (isLoading) return null

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Update your interests' : 'What do you want to learn about?'}
        </h1>
        <p className="text-muted-foreground">
          Pick as many broad topics as you like — you can always change these later.
        </p>
      </div>

      <DomainPicker selected={selected} onChange={setSelected} />

      <Button
        size="lg"
        disabled={selected.length === 0 || isSaving}
        onClick={handleContinue}
        className="mt-2"
      >
        {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Start scrolling'}
      </Button>
    </div>
  )
}
