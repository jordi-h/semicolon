/**
 * Shared domain types for InfiniScroll. Define types here first, build
 * components/hooks against them — see README for the full data model.
 */

/** The six broad umbrella domains available at launch. */
export const DOMAINS = [
  'science',
  'technology',
  'history',
  'geography',
  'culture',
  'space',
] as const

export type Domain = (typeof DOMAINS)[number]

export const DOMAIN_LABELS: Record<Domain, string> = {
  science: 'Science',
  technology: 'Technology',
  history: 'History',
  geography: 'Geography',
  culture: 'Culture & Society',
  space: 'Space & Universe',
}

export const DOMAIN_EMOJI: Record<Domain, string> = {
  science: '🔬',
  technology: '💻',
  history: '📜',
  geography: '🌍',
  culture: '🎭',
  space: '🪐',
}

/** A single self-contained trivia card. */
export interface Fact {
  id: string
  domain: Domain
  hook: string
  fact: string
  whyItMatters?: string
  tags: string[]
  sourceUrl?: string
}

/** A user's selected domains, editable any time from settings. */
export interface UserPreferences {
  userId: string
  domains: Domain[]
  updatedAt: string
}

export type Reaction = 'more' | 'less'

/** A user's saved (hearted) fact. */
export interface SavedFact {
  userId: string
  factId: string
  savedAt: string
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
}
