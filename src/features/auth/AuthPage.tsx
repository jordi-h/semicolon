import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/Logo'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { useAuth } from '@/features/auth/AuthContext'
import { localizeAuthError } from '@/lib/i18n/authErrors'
import { useLocale } from '@/lib/i18n/LocaleContext'

export function AuthPage() {
  const {
    user,
    authRequired,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signInWithOAuth,
  } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oauthPending, setOauthPending] = useState(false)

  if (!authRequired || user) {
    return <Navigate to="/feed" replace />
  }

  async function handleSubmit(mode: 'signin' | 'signup') {
    setError(null)
    setSubmitting(true)
    const result =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password)
    setSubmitting(false)

    if (result.errorCode) {
      setError(localizeAuthError(result.errorCode, t))
      return
    }
    navigate('/onboarding')
  }

  async function handleMagicLink() {
    setError(null)
    setSubmitting(true)
    const result = await signInWithMagicLink(email)
    setSubmitting(false)
    if (result.errorCode) {
      setError(localizeAuthError(result.errorCode, t))
      return
    }
    setMagicLinkSent(true)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setOauthPending(true)
    const result = await signInWithOAuth()
    // A successful call navigates the browser away immediately, so only
    // reaching here with an error means it's worth resetting the button.
    if (result.errorCode) {
      setError(localizeAuthError(result.errorCode, t))
      setOauthPending(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="h-16 w-16 shadow-md" />
        <div>
          <h1 className="font-display text-display-title">semicolon</h1>
          <p className="text-body-md text-muted-foreground">{t('appTagline')}</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        disabled={oauthPending}
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon className="h-4 w-4" />
        {oauthPending ? t('auth.redirecting') : t('auth.continueWithGoogle')}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t('auth.orUseEmail')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">{t('auth.signInTab')}</TabsTrigger>
          <TabsTrigger value="signup">{t('auth.signUpTab')}</TabsTrigger>
        </TabsList>

        {(['signin', 'signup'] as const).map((mode) => (
          <TabsContent key={mode} value={mode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-email`}>{t('auth.emailLabel')}</Label>
              <Input
                id={`${mode}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-password`}>{t('auth.passwordLabel')}</Label>
              <Input
                id={`${mode}-password`}
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {magicLinkSent && (
              <p className="text-sm text-muted-foreground">{t('auth.magicLinkSent')}</p>
            )}

            <Button
              className="w-full"
              disabled={submitting || !email || !password}
              onClick={() => handleSubmit(mode)}
            >
              {mode === 'signin' ? t('auth.signInSubmit') : t('auth.signUpSubmit')}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              disabled={submitting || !email}
              onClick={handleMagicLink}
            >
              {t('auth.magicLinkCta')}
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
