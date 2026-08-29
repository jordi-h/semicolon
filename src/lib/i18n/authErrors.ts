import type { AuthErrorCode } from '@/features/auth/AuthContext'
import type { TranslationKey } from '@/lib/i18n/en'

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string

/** Turns a stable AuthErrorCode into a localized, user-facing message.
 * Lives here (not in AuthContext) because it needs useLocale()'s `t`,
 * and AuthContext is rendered above LocaleProvider in the tree. */
export function localizeAuthError(code: AuthErrorCode, t: TFunction): string {
  switch (code) {
    case 'invalid_credentials':
      return t('auth.error.invalidCredentials')
    case 'user_already_exists':
      return t('auth.error.userExists')
    case 'weak_password':
      return t('auth.error.weakPassword')
    case 'rate_limited':
      return t('auth.error.rateLimited')
    case 'email_not_confirmed':
      return t('auth.error.emailNotConfirmed')
    case 'unknown':
      return t('auth.error.generic')
  }
}
