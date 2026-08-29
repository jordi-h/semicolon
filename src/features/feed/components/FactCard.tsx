import { Search } from 'lucide-react'

import { HeartButton } from '@/features/feed/components/HeartButton'
import { ReactionButtons } from '@/features/feed/components/ReactionButtons'
import { factSearchUrl } from '@/features/feed/lib/factSearchUrl'
import { ShareButton } from '@/features/share/ShareButton'
import { DOMAIN_GRADIENTS } from '@/lib/domainTheme'
import { DOMAIN_EMOJI, DOMAIN_LABELS, type Fact, type Reaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FactCardProps {
  fact: Fact
  saved: boolean
  onToggleSave: () => void
  onReact: (reaction: Reaction) => void
  active: boolean
}

export function FactCard({ fact, saved, onToggleSave, onReact, active }: FactCardProps) {
  return (
    <article
      className={cn(
        'relative flex h-full w-full snap-start snap-always flex-col justify-end overflow-hidden bg-gradient-to-br p-6 pb-10 text-white sm:rounded-2xl',
        DOMAIN_GRADIENTS[fact.domain],
      )}
      aria-hidden={!active}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative z-10 mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
        <span aria-hidden="true">{DOMAIN_EMOJI[fact.domain]}</span>
        <span>{DOMAIN_LABELS[fact.domain]}</span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center gap-4">
        <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{fact.hook}</h2>
        <p className="text-lg leading-relaxed text-white/95">{fact.fact}</p>
        {fact.whyItMatters && (
          <p className="border-l-2 border-white/40 pl-3 text-sm italic text-white/75">
            Why it matters: {fact.whyItMatters}
          </p>
        )}
        <a
          href={factSearchUrl(fact)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <Search size={14} />
          Dive deeper
        </a>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between">
        <ReactionButtons onReact={onReact} />
        <div className="flex items-center gap-2">
          <ShareButton fact={fact} size="lg" />
          <HeartButton saved={saved} onToggle={onToggleSave} size="lg" />
        </div>
      </div>
    </article>
  )
}
