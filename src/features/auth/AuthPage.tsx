import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/Logo'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { GithubIcon } from '@/components/icons/GithubIcon'
import { FacebookIcon } from '@/components/icons/FacebookIcon'
import { useAuth, type OAuthProvider } from '@/features/auth/AuthContext'

const OAUTH_PROVIDERS: { id: OAuthProvider; label: string; icon: ReactNode }[] = [
  { id: 'google', label: 'Google', icon: <GoogleIcon className="h-4 w-4" /> },
  { id: 'github', label: 'GitHub', icon: <GithubIcon className="h-4 w-4" /> },
  { id: 'facebook', label: 'Facebook', icon: <FacebookIcon className="h-4 w-4" /> },
]

export function AuthPage() {
  const {
    user,
    authRequired,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signInWithOAuth,
  } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null)

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

    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/onboarding')
  }

  async function handleMagicLink() {
    setError(null)
    setSubmitting(true)
    const result = await signInWithMagicLink(email)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setMagicLinkSent(true)
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null)
    setOauthPending(provider)
    const result = await signInWithOAuth(provider)
    // A successful call navigates the browser away immediately, so only
    // reaching here with an error means it's worth resetting the button.
    if (result.error) {
      setError(result.error)
      setOauthPending(null)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="h-16 w-16 rounded-2xl shadow-md" />
        <div>
          <h1 className="text-2xl font-bold">semicolon</h1>
          <p className="text-muted-foreground">Bite-sized knowledge, one card at a time.</p>
        </div>
      </div>

      <div className="space-y-2">
        {OAUTH_PROVIDERS.map(({ id, label, icon }) => (
          <Button
            key={id}
            variant="outline"
            className="w-full gap-2"
            disabled={oauthPending !== null}
            onClick={() => handleOAuth(id)}
          >
            {icon}
            {oauthPending === id ? 'Redirecting…' : `Continue with ${label}`}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or use email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>

        {(['signin', 'signup'] as const).map((mode) => (
          <TabsContent key={mode} value={mode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-email`}>Email</Label>
              <Input
                id={`${mode}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-password`}>Password</Label>
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
              <p className="text-sm text-muted-foreground">
                Check your email for a magic link to sign in.
              </p>
            )}

            <Button
              className="w-full"
              disabled={submitting || !email || !password}
              onClick={() => handleSubmit(mode)}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              disabled={submitting || !email}
              onClick={handleMagicLink}
            >
              Email me a magic link instead
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
