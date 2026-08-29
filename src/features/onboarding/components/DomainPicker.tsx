import { Check } from 'lucide-react'

import { Card } from '@/components/ui/card'
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
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            {isSelected && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={12} />
              </span>
            )}
            <span className="text-3xl" aria-hidden="true">
              {DOMAIN_EMOJI[domain]}
            </span>
            <span className="font-medium">{DOMAIN_LABELS[locale][domain]}</span>
          </Card>
        )
      })}
    </div>
  )
}
