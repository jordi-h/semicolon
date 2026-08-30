import type { TranslationKey } from '@/lib/i18n/en'

export const nl: Record<TranslationKey, string> = {
  appTagline: 'Kennis in hapklare brokjes, één kaart per keer.',

  'common.close': 'Sluiten',

  'auth.continueWithGoogle': 'Doorgaan met Google',
  'auth.redirecting': 'Doorverwijzen…',
  'auth.orUseEmail': 'of gebruik je e-mail',
  'auth.signInTab': 'Inloggen',
  'auth.signUpTab': 'Registreren',
  'auth.emailLabel': 'E-mail',
  'auth.passwordLabel': 'Wachtwoord',
  'auth.magicLinkSent': 'Kijk in je mailbox voor een link om in te loggen.',
  'auth.magicLinkCta': 'Stuur me in plaats daarvan een magische link',
  'auth.signInSubmit': 'Inloggen',
  'auth.signUpSubmit': 'Account aanmaken',

  'auth.error.invalidCredentials': 'Onjuist e-mailadres of wachtwoord.',
  'auth.error.userExists': 'Er bestaat al een account met dit e-mailadres.',
  'auth.error.weakPassword': 'Wachtwoord is te zwak — probeer een langer wachtwoord.',
  'auth.error.rateLimited': 'Te veel pogingen — wacht even en probeer het opnieuw.',
  'auth.error.emailNotConfirmed': 'Bevestig je e-mailadres voordat je inlogt.',
  'auth.error.generic': 'Er is iets misgegaan — probeer het opnieuw.',

  'onboarding.titleEdit': 'Werk je interesses bij',
  'onboarding.titleNew': 'Wat wil je leren?',
  'onboarding.subtitle':
    'Kies zoveel brede onderwerpen als je wilt — je kunt dit later altijd aanpassen.',
  'onboarding.saving': 'Opslaan…',
  'onboarding.saveChanges': 'Wijzigingen opslaan',
  'onboarding.startScrolling': 'Beginnen',

  'feed.settingsAriaLabel': 'Instellingen',
  'feed.emptyTitle': 'Nog geen feitjes in je gekozen onderwerpen.',
  'feed.emptyBefore': 'Voeg meer onderwerpen toe via',
  'feed.emptyLink': 'instellingen',
  'feed.scrollHint': 'Swipe omhoog voor meer',
  'feed.offline': 'Offline — opgeslagen feitjes',

  'fact.rememberThis': 'Weet je het nog?',
  'fact.whyItMatters': 'Waarom het ertoe doet',
  'fact.diveDeeper': 'Meer weten',

  'heart.remove': 'Verwijderen uit opgeslagen feitjes',
  'heart.save': 'Dit feitje opslaan',

  'reaction.more': 'Meer zoals dit',
  'reaction.less': 'Minder zoals dit',
  'reaction.toastMore': 'Je krijgt meer van dit soort content te zien',
  'reaction.toastLess': 'Je krijgt minder van dit soort content te zien',

  'exhaustion.notice':
    'Je hebt alles gezien binnen je onderwerpen — hier is oudere content, of voeg meer onderwerpen toe in de instellingen.',

  'streak.dayLabel': 'dag',
  'streak.daysLabel': 'dagen',

  'settings.backAriaLabel': 'Terug naar feed',
  'settings.title': 'Profiel & instellingen',
  'settings.signedInAs': 'Ingelogd als {{email}}',
  'settings.currentStreak': 'Huidige reeks',
  'settings.bestStreak': 'Beste reeks',
  'settings.factsLearned': 'Geleerde feitjes',
  'settings.yourTopics': 'Jouw onderwerpen',
  'settings.editTopics': 'Onderwerpen bewerken',
  'settings.savedFacts': 'Opgeslagen feitjes',
  'settings.signOut': 'Uitloggen',
  'settings.language': 'Taal',

  'saved.title': 'Opgeslagen feitjes',
  'saved.loading': 'Laden…',
  'saved.empty': 'Nog niets opgeslagen — tik op het hartje bij een kaart om die hier te bewaren.',

  'share.ariaLabel': 'Dit feitje delen',
  'share.shared': 'Gedeeld!',
  'share.imageSavedLinkCopied': 'Afbeelding opgeslagen en link gekopieerd!',
  'share.imageSaved': 'Afbeelding opgeslagen!',
  'share.error': 'Delen mislukt — probeer opnieuw',

  'sharedFact.notFound': 'Dit feitje kon niet worden gevonden.',
  'sharedFact.openSemicolon': 'semicolon openen',
  'sharedFact.footerTagline':
    'Een TikTok-achtige feed van hapklare kennis — bij elke swipe een nieuw feitje.',
  'sharedFact.getSemicolon': 'semicolon downloaden',
}
