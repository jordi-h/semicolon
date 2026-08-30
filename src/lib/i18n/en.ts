/**
 * English UI strings — the canonical dictionary. Every other locale
 * dictionary (fr.ts, nl.ts, es.ts) is typed as Record<TranslationKey,
 * string>, so TypeScript itself catches a missing or misspelled key.
 */
export const en = {
  appTagline: 'Bite-sized knowledge, one card at a time.',

  'common.close': 'Close',

  'auth.continueWithGoogle': 'Continue with Google',
  'auth.redirecting': 'Redirecting…',
  'auth.orUseEmail': 'or use email',
  'auth.signInTab': 'Sign in',
  'auth.signUpTab': 'Sign up',
  'auth.emailLabel': 'Email',
  'auth.passwordLabel': 'Password',
  'auth.magicLinkSent': 'Check your email for a magic link to sign in.',
  'auth.magicLinkCta': 'Email me a magic link instead',
  'auth.signInSubmit': 'Sign in',
  'auth.signUpSubmit': 'Create account',

  'auth.error.invalidCredentials': 'Incorrect email or password.',
  'auth.error.userExists': 'An account with this email already exists.',
  'auth.error.weakPassword': 'Password is too weak — try a longer one.',
  'auth.error.rateLimited': 'Too many attempts — please wait a moment and try again.',
  'auth.error.emailNotConfirmed': 'Please confirm your email before signing in.',
  'auth.error.generic': 'Something went wrong — please try again.',

  'onboarding.titleEdit': 'Update your interests',
  'onboarding.titleNew': 'What do you want to learn about?',
  'onboarding.subtitle':
    'Pick as many broad topics as you like — you can always change these later.',
  'onboarding.saving': 'Saving…',
  'onboarding.saveChanges': 'Save changes',
  'onboarding.startScrolling': 'Start scrolling',

  'feed.settingsAriaLabel': 'Settings',
  'feed.emptyTitle': 'No facts yet in your chosen domains.',
  'feed.emptyBefore': 'Try adding more domains from',
  'feed.emptyLink': 'settings',
  'feed.scrollHint': 'Swipe up for more',
  'feed.offline': 'Offline — showing saved facts',

  'fact.rememberThis': 'Remember this?',
  'fact.whyItMatters': 'Why it matters',
  'fact.diveDeeper': 'Dive deeper',

  'heart.remove': 'Remove from saved facts',
  'heart.save': 'Save this fact',

  'reaction.more': 'More like this',
  'reaction.less': 'Less like this',
  'reaction.toastMore': 'Showing you more like this',
  'reaction.toastLess': 'Showing you less like this',

  'exhaustion.notice':
    "You've seen everything in your topics — here's older content, or add more domains in settings.",

  'streak.dayLabel': 'day',
  'streak.daysLabel': 'days',

  'settings.backAriaLabel': 'Back to feed',
  'settings.title': 'Profile & settings',
  'settings.signedInAs': 'Signed in as {{email}}',
  'settings.currentStreak': 'Current streak',
  'settings.bestStreak': 'Best streak',
  'settings.factsLearned': 'Facts learned',
  'settings.yourTopics': 'Your topics',
  'settings.editTopics': 'Edit topics',
  'settings.savedFacts': 'Saved facts',
  'settings.signOut': 'Sign out',

  'settings.resetTitle': 'Reset progress',
  'settings.resetOpen': 'Reset progress…',
  'settings.resetKeepsNote': 'Your topics and language are always kept.',
  'settings.resetChooseTitle': 'What would you like to reset?',
  'settings.resetScopeHistory': 'Seen facts',
  'settings.resetScopeHistoryDetail':
    'Every fact becomes new again, and the feed forgets what it learned about your taste. Streaks and saved facts are kept.',
  'settings.resetScopeHistoryAndStats': 'Seen facts and statistics',
  'settings.resetScopeHistoryAndStatsDetail':
    'The above, plus your streak and facts-learned count go back to zero. Saved facts are kept.',
  'settings.resetScopeEverything': 'Everything',
  'settings.resetScopeEverythingDetail':
    'The above, plus your saved facts are deleted. Only your topics and language remain.',
  'settings.resetConfirmTitle': 'Are you sure?',
  'settings.resetConfirmBody': 'This will permanently delete {{what}}. It cannot be undone.',
  'settings.resetConfirmCta': 'Reset',
  'settings.resetCancel': 'Cancel',
  'settings.resetWorking': 'Resetting…',
  'settings.resetDone': 'Your progress has been reset.',
  'settings.resetFailed': 'Something went wrong. Nothing was reset — please try again.',
  'settings.language': 'Language',

  'saved.title': 'Saved facts',
  'saved.loading': 'Loading…',
  'saved.empty': 'Nothing saved yet — tap the heart on a card in your feed to keep it here.',

  'share.ariaLabel': 'Share this fact',
  'share.shared': 'Shared!',
  'share.imageSavedLinkCopied': 'Image saved & link copied!',
  'share.imageSaved': 'Image saved!',
  'share.error': 'Could not share — try again',

  'sharedFact.notFound': "This fact couldn't be found.",
  'sharedFact.openSemicolon': 'Open semicolon',
  'sharedFact.footerTagline': 'A TikTok-style feed of bite-sized knowledge — a new fact every swipe.',
  'sharedFact.getSemicolon': 'Get semicolon',
} as const

export type TranslationKey = keyof typeof en
