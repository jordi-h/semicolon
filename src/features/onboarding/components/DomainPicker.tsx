import { Check } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { domainTint, DOMAIN_ACCENT } from '@/lib/domainTheme'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { DOMAIN_EMOJI, DOMAIN_LABELS, DOMAINS, type Domain } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DomainPickerProps {
  selected: Domain[]
  onChange: (domains: Domain[]) => void
}

export function DomainPicker({ selected, onChange }: DomainPickerProps) {
  const { locale } = useLocale()

  function toggle(domain: Domain) {
    if (selected.includes(domain)) {
      onChange(selected.filter((d) => d !== domain))
    } else {
      onChange([...selected, domain])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {DOMAINS.map((domain) => {
        const isSelected = selected.includes(domain)
        const accent = DOMAIN_ACCENT[domain]
        return (
          <Card
            key={domain}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => toggle(domain)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle(domain)
              }
            }}
            style={
              isSelected
                ? {
                    borderColor: accent,
                    background: domainTint(domain, 0.14),
                    boxShadow: `0 0 0 1px ${accent}`,
                  }
                : undefined
            }
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center transition-colors',
              !isSelected && 'hover:border-muted-foreground/40 hover:bg-secondary/50',
            )}
          >
            {isSelected && (
              <span
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-background"
                style={{ background: accent }}
              >
                <Check size={12} />
              </span>
            )}
            <span className="text-3xl" aria-hidden="true">
              {DOMAIN_EMOJI[domain]}
            </span>
            <span className="text-body-md font-medium">{DOMAIN_LABELS[locale][domain]}</span>
          </Card>
        )
      })}
    </div>
  )
}
