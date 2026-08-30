/**
 * Shared domain types for semico. Define types here first, build
 * components/hooks against them — see README for the full data model.
 */

/** The twelve broad umbrella domains available at launch. */
export const DOMAINS = [
  'science',
  'technology',
  'history',
  'geography',
  'culture',
  'space',
  'language',
  'psychology',
  'art',
  'food',
  'sports',
  'law',
] as const

export type Domain = (typeof DOMAINS)[number]

/** The four UI + content languages available at launch. */
export const LOCALES = ['en', 'fr', 'nl', 'es'] as const

export type Locale = (typeof LOCALES)[number]

/** Language names shown in the language picker itself — always shown in
 * their own language (e.g. "Français" even when the UI is in English), a
 * standard convention so users can find their language regardless of
 * what's currently selected. */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
  es: 'Español',
}

/** Domain display names, localized. Facts' own text is localized
 * separately (see fact.translations / fact_translations table) since it's
 * curated per-fact content rather than a short fixed label. */
export const DOMAIN_LABELS: Record<Locale, Record<Domain, string>> = {
  en: {
    science: 'Science',
    technology: 'Technology',
    history: 'History',
    geography: 'Geography',
    culture: 'Culture & Society',
    space: 'Space & Universe',
    language: 'Language & Etymology',
    psychology: 'Psychology & the Mind',
    art: 'Art & Design',
    food: 'Food & Cuisine',
    sports: 'Sports & Fitness',
    law: 'Law & Politics',
  },
  fr: {
    science: 'Sciences',
    technology: 'Technologie',
    history: 'Histoire',
    geography: 'Géographie',
    culture: 'Culture & société',
    space: 'Espace & Univers',
    language: 'Langue & étymologie',
    psychology: 'Psychologie & esprit',
    art: 'Art & design',
    food: 'Cuisine & gastronomie',
    sports: 'Sport & forme physique',
    law: 'Droit & politique',
  },
  nl: {
    science: 'Wetenschap',
    technology: 'Technologie',
    history: 'Geschiedenis',
    geography: 'Aardrijkskunde',
    culture: 'Cultuur & maatschappij',
    space: 'Ruimte & heelal',
    language: 'Taal & etymologie',
    psychology: 'Psychologie & de geest',
    art: 'Kunst & design',
    food: 'Eten & gastronomie',
    sports: 'Sport & fitness',
    law: 'Recht & politiek',
  },
  es: {
    science: 'Ciencia',
    technology: 'Tecnología',
    history: 'Historia',
    geography: 'Geografía',
    culture: 'Cultura y sociedad',
    space: 'Espacio y universo',
    language: 'Idioma y etimología',
    psychology: 'Psicología y la mente',
    art: 'Arte y diseño',
    food: 'Gastronomía y cocina',
    sports: 'Deporte y forma física',
    law: 'Derecho y política',
  },
}

export const DOMAIN_EMOJI: Record<Domain, string> = {
  science: '🔬',
  technology: '💻',
  history: '📜',
  geography: '🌍',
  culture: '🎭',
  space: '🪐',
  language: '🔤',
  psychology: '🧠',
  art: '🎨',
  food: '🍽️',
  sports: '🏅',
  law: '⚖️',
}

/** A single self-contained trivia card, resolved to the caller's locale.
 * hook/fact/whyItMatters are always in that locale (falling back to the
 * English original when no translation exists yet for a given fact). */
export interface Fact {
  id: string
  domain: Domain
  hook: string
  fact: string
  whyItMatters?: string
  tags: string[]
  sourceUrl?: string
  /** Non-English curated text, keyed by locale. Only present on the raw
   * local seed data (src/data/facts/*.json) — used to resolve the fields
   * above in the no-Supabase local fallback; never present on a Fact
   * returned from the API, which is already resolved. */
  translations?: Partial<Record<Exclude<Locale, 'en'>, FactTranslation>>
}

export interface FactTranslation {
  hook: string
  fact: string
  whyItMatters?: string
}

/** A user's selected domains and language, editable any time from settings. */
export interface UserPreferences {
  userId: string
  domains: Domain[]
  locale: Locale
  updatedAt: string
}

export type Reaction = 'more' | 'less'

/** A user's saved (hearted) fact. */
export interface SavedFact {
  userId: string
  factId: string
  savedAt: string
}

/** Per-user, per-tag engagement signal — the finer-grained sibling of
 * DomainAffinity. Domains are broad (11 buckets), so "less like this" on
 * a chemistry card would otherwise damp all of Science. Every fact
 * already carries 1-3 curated tags, so the same engagement signal can be
 * tracked per tag and used to bias which fact is picked *within* the
 * chosen domain. Deliberately reuses DomainAffinity's shape so the same
 * (unit-tested) weighting math in src/lib/engagement.ts applies. */
export interface TagAffinity {
  userId: string
  tag: string
  avgDwellMs: number
  reactionScore: number
  cardsSeen: number
}

/** Per-user, per-domain engagement signal used to weight the feed. */
export interface DomainAffinity {
  userId: string
  domain: Domain
  /** Rolling average of ms spent on a card before skipping, in this domain. */
  avgDwellMs: number
  /** Net reaction score: +1 per "more", -1 per "less". */
  reactionScore: number
  cardsSeen: number
}

/** Per-user stats surfaced in the profile screen. */
export interface UserStats {
  userId: string
  factsLearned: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
  /** Whether the one-time "you've seen everything" notice has been shown. */
  poolExhaustedNoticeShown: boolean
}

/** One row of the per-user seen-facts log — see src/features/feed/lib/pickNextFact.ts
 * for how firstSeenAt vs. lastShownAt are used differently: firstSeenAt gates
 * "resurface" eligibility (must be >1 week old) and is never overwritten;
 * lastShownAt updates every re-show and drives the exhausted-pool fallback
 * ("least-recently-shown first"). */
export interface SeenFact {
  factId: string
  firstSeenAt: string
  lastShownAt: string
}

/** Which of the three explicit feed-selection branches produced a card. */
export type CardSource = 'normal' | 'resurfaced' | 'fallback'
