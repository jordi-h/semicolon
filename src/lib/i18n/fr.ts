import type { TranslationKey } from '@/lib/i18n/en'

export const fr: Record<TranslationKey, string> = {
  appTagline: 'Des connaissances en petites bouchées, une carte à la fois.',

  'common.close': 'Fermer',

  'auth.continueWithGoogle': 'Continuer avec Google',
  'auth.redirecting': 'Redirection…',
  'auth.orUseEmail': 'ou utilisez votre email',
  'auth.signInTab': 'Connexion',
  'auth.signUpTab': 'Inscription',
  'auth.emailLabel': 'Email',
  'auth.passwordLabel': 'Mot de passe',
  'auth.magicLinkSent': 'Vérifiez vos emails pour un lien de connexion.',
  'auth.magicLinkCta': "M'envoyer un lien de connexion à la place",
  'auth.signInSubmit': 'Se connecter',
  'auth.signUpSubmit': 'Créer un compte',

  'auth.error.invalidCredentials': 'Email ou mot de passe incorrect.',
  'auth.error.userExists': 'Un compte existe déjà avec cet email.',
  'auth.error.weakPassword': 'Mot de passe trop faible — essayez-en un plus long.',
  'auth.error.rateLimited': 'Trop de tentatives — veuillez patienter puis réessayer.',
  'auth.error.emailNotConfirmed': 'Veuillez confirmer votre email avant de vous connecter.',
  'auth.error.generic': 'Une erreur est survenue — veuillez réessayer.',

  'onboarding.titleEdit': 'Modifiez vos centres d\'intérêt',
  'onboarding.titleNew': 'Que voulez-vous apprendre ?',
  'onboarding.subtitle':
    'Choisissez autant de sujets que vous voulez — vous pourrez toujours les modifier plus tard.',
  'onboarding.saving': 'Enregistrement…',
  'onboarding.saveChanges': 'Enregistrer',
  'onboarding.startScrolling': 'Commencer',

  'feed.settingsAriaLabel': 'Paramètres',
  'feed.emptyTitle': 'Aucune information dans vos domaines choisis pour le moment.',
  'feed.emptyBefore': 'Ajoutez d\'autres domaines dans les',
  'feed.emptyLink': 'paramètres',
  'feed.scrollHint': 'Glissez vers le haut',
  'feed.offline': 'Hors ligne — faits enregistrés',

  'fact.rememberThis': 'Vous vous souvenez ?',
  'fact.whyItMatters': "Pourquoi c'est important",
  'fact.diveDeeper': 'En savoir plus',

  'heart.remove': 'Retirer des favoris',
  'heart.save': 'Enregistrer ce fait',

  'reaction.more': "Plus de contenu comme ça",
  'reaction.less': 'Moins de contenu comme ça',
  'reaction.toastMore': 'On vous en montre plus comme ça',
  'reaction.toastLess': 'On vous en montre moins comme ça',

  'exhaustion.notice':
    'Vous avez tout vu dans vos sujets — voici du contenu plus ancien, ou ajoutez d\'autres domaines dans les paramètres.',

  'streak.dayLabel': 'jour',
  'streak.daysLabel': 'jours',

  'settings.backAriaLabel': 'Retour au fil',
  'settings.title': 'Profil et paramètres',
  'settings.signedInAs': 'Connecté en tant que {{email}}',
  'settings.currentStreak': 'Série en cours',
  'settings.bestStreak': 'Meilleure série',
  'settings.factsLearned': 'Faits appris',
  'settings.yourTopics': 'Vos sujets',
  'settings.editTopics': 'Modifier les sujets',
  'settings.savedFacts': 'Faits enregistrés',
  'settings.signOut': 'Se déconnecter',

  'settings.resetTitle': 'Réinitialiser la progression',
  'settings.resetOpen': 'Réinitialiser la progression…',
  'settings.resetKeepsNote': 'Vos sujets et votre langue sont toujours conservés.',
  'settings.resetChooseTitle': 'Que souhaitez-vous réinitialiser ?',
  'settings.resetScopeHistory': 'Les faits déjà vus',
  'settings.resetScopeHistoryDetail':
    'Chaque fait redevient inédit, et le fil oublie ce qu’il avait appris de vos goûts. Vos séries et vos faits enregistrés sont conservés.',
  'settings.resetScopeHistoryAndStats': 'Les faits vus et les statistiques',
  'settings.resetScopeHistoryAndStatsDetail':
    'Tout ce qui précède, plus votre série et votre compteur de faits appris remis à zéro. Vos faits enregistrés sont conservés.',
  'settings.resetScopeEverything': 'Tout',
  'settings.resetScopeEverythingDetail':
    'Tout ce qui précède, plus la suppression de vos faits enregistrés. Seuls vos sujets et votre langue subsistent.',
  'settings.resetConfirmTitle': 'Êtes-vous sûr ?',
  'settings.resetConfirmBody':
    'Cette action supprimera définitivement {{what}}. Elle est irréversible.',
  'settings.resetConfirmCta': 'Réinitialiser',
  'settings.resetCancel': 'Annuler',
  'settings.resetWorking': 'Réinitialisation…',
  'settings.resetDone': 'Votre progression a été réinitialisée.',
  'settings.resetFailed': 'Une erreur est survenue. Rien n’a été réinitialisé — veuillez réessayer.',
  'settings.language': 'Langue',

  'saved.title': 'Faits enregistrés',
  'saved.loading': 'Chargement…',
  'saved.empty':
    'Rien d\'enregistré pour l\'instant — appuyez sur le cœur d\'une carte pour la garder ici.',

  'share.ariaLabel': 'Partager ce fait',
  'share.shared': 'Partagé !',
  'share.imageSavedLinkCopied': 'Image enregistrée et lien copié !',
  'share.imageSaved': 'Image enregistrée !',
  'share.error': 'Impossible de partager — réessayez',

  'sharedFact.notFound': 'Ce fait est introuvable.',
  'sharedFact.openSemico': 'Ouvrir semico',
  'sharedFact.footerTagline':
    'Un fil façon TikTok de connaissances en petites bouchées — un nouveau fait à chaque glissement.',
  'sharedFact.getSemico': 'Obtenir semico',
}
