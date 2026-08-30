import type { TranslationKey } from '@/lib/i18n/en'

export const es: Record<TranslationKey, string> = {
  appTagline: 'Conocimiento en bocados pequeños, una tarjeta a la vez.',

  'common.close': 'Cerrar',

  'auth.continueWithGoogle': 'Continuar con Google',
  'auth.redirecting': 'Redirigiendo…',
  'auth.orUseEmail': 'o usa tu email',
  'auth.signInTab': 'Iniciar sesión',
  'auth.signUpTab': 'Registrarse',
  'auth.emailLabel': 'Email',
  'auth.passwordLabel': 'Contraseña',
  'auth.magicLinkSent': 'Revisa tu email para recibir un enlace de acceso.',
  'auth.magicLinkCta': 'Enviarme un enlace mágico en su lugar',
  'auth.signInSubmit': 'Iniciar sesión',
  'auth.signUpSubmit': 'Crear cuenta',

  'auth.error.invalidCredentials': 'Email o contraseña incorrectos.',
  'auth.error.userExists': 'Ya existe una cuenta con este email.',
  'auth.error.weakPassword': 'La contraseña es demasiado débil — prueba una más larga.',
  'auth.error.rateLimited': 'Demasiados intentos — espera un momento e inténtalo de nuevo.',
  'auth.error.emailNotConfirmed': 'Confirma tu email antes de iniciar sesión.',
  'auth.error.generic': 'Algo salió mal — inténtalo de nuevo.',

  'onboarding.titleEdit': 'Actualiza tus intereses',
  'onboarding.titleNew': '¿Qué quieres aprender?',
  'onboarding.subtitle':
    'Elige tantos temas generales como quieras — siempre podrás cambiarlos más tarde.',
  'onboarding.saving': 'Guardando…',
  'onboarding.saveChanges': 'Guardar cambios',
  'onboarding.startScrolling': 'Empezar',

  'feed.settingsAriaLabel': 'Ajustes',
  'feed.emptyTitle': 'Aún no hay datos en los temas que elegiste.',
  'feed.emptyBefore': 'Añade más temas desde',
  'feed.emptyLink': 'ajustes',
  'feed.scrollHint': 'Desliza hacia arriba',
  'feed.offline': 'Sin conexión — datos guardados',

  'fact.rememberThis': '¿Te acuerdas?',
  'fact.whyItMatters': 'Por qué importa',
  'fact.diveDeeper': 'Saber más',

  'heart.remove': 'Quitar de guardados',
  'heart.save': 'Guardar este dato',

  'reaction.more': 'Más contenido así',
  'reaction.less': 'Menos contenido así',
  'reaction.toastMore': 'Te mostraremos más contenido así',
  'reaction.toastLess': 'Te mostraremos menos contenido así',

  'exhaustion.notice':
    'Has visto todo en tus temas — aquí tienes contenido más antiguo, o añade más temas en ajustes.',

  'streak.dayLabel': 'día',
  'streak.daysLabel': 'días',

  'settings.backAriaLabel': 'Volver al feed',
  'settings.title': 'Perfil y ajustes',
  'settings.signedInAs': 'Sesión iniciada como {{email}}',
  'settings.currentStreak': 'Racha actual',
  'settings.bestStreak': 'Mejor racha',
  'settings.factsLearned': 'Datos aprendidos',
  'settings.yourTopics': 'Tus temas',
  'settings.editTopics': 'Editar temas',
  'settings.savedFacts': 'Datos guardados',
  'settings.signOut': 'Cerrar sesión',
  'settings.language': 'Idioma',

  'saved.title': 'Datos guardados',
  'saved.loading': 'Cargando…',
  'saved.empty':
    'Aún no has guardado nada — toca el corazón en una tarjeta de tu feed para guardarla aquí.',

  'share.ariaLabel': 'Compartir este dato',
  'share.shared': '¡Compartido!',
  'share.imageSavedLinkCopied': '¡Imagen guardada y enlace copiado!',
  'share.imageSaved': '¡Imagen guardada!',
  'share.error': 'No se pudo compartir — inténtalo de nuevo',

  'sharedFact.notFound': 'No se pudo encontrar este dato.',
  'sharedFact.openSemicolon': 'Abrir semicolon',
  'sharedFact.footerTagline':
    'Un feed al estilo TikTok de conocimiento en bocados pequeños — un dato nuevo en cada deslizamiento.',
  'sharedFact.getSemicolon': 'Obtener semicolon',
}
