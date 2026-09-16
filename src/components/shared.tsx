import { useCallback, useState } from 'react'
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
} from 'lucide-react'
import type { Item } from '../lib/types'
import { CATEGORIES } from '../lib/categories'
import { urgencyOf, type Urgency } from '../lib/insights'
import { relativeDue } from '../lib/format'
import { Badge, cn } from './ui'

export function CategoryChip({
  category,
  withLabel = true,
}: {
  category: Item['category']
  withLabel?: boolean
}) {
  const meta = CATEGORIES[category]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold',
        meta.soft,
        meta.text,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {withLabel && meta.label}
    </span>
  )
}

export function CategoryIconBadge({ category }: { category: Item['category'] }) {
  const meta = CATEGORIES[category]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
        meta.soft,
        meta.text,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}

const urgencyTone: Record<Urgency, Parameters<typeof Badge>[0]['tone']> = {
  overdue: 'rose',
  'due-soon': 'amber',
  upcoming: 'sky',
  later: 'neutral',
  none: 'neutral',
}

export function UrgencyBadge({ item }: { item: Item }) {
  if (item.status === 'resolved')
    return (
      <Badge tone="emerald">
        <CheckCircle2 className="h-3 w-3" /> Resolved
      </Badge>
    )
  if (item.status === 'archived') return <Badge tone="neutral">Archived</Badge>
  const u = urgencyOf(item)
  if (u === 'none') return <Badge tone="neutral">No date</Badge>
  const Icon = u === 'overdue' ? AlarmClock : CalendarClock
  return (
    <Badge tone={urgencyTone[u]}>
      <Icon className="h-3 w-3" />
      {relativeDue(item.dueDate)}
    </Badge>
  )
}

export function AutoPayBadge({ item }: { item: Item }) {
  if (!item.autoPay) return null
  return (
    <Badge tone="brand">
      <CircleDollarSign className="h-3 w-3" /> Auto-pay
    </Badge>
  )
}

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    const done = () => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done))
    } else {
      fallback(text, done)
    }
  }, [])
  return [copied, copy]
}

function fallback(text: string, done: () => void) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    done()
  } catch {
    /* ignore */
  }
}
