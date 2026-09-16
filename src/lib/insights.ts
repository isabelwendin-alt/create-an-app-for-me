import type { Item } from './types'
import { CATEGORIES } from './categories'
import {
  daysUntil,
  formatMoney,
  monthlyMultiplier,
  relativeDue,
} from './format'
import { normalizeName } from './utils'

export type Urgency = 'overdue' | 'due-soon' | 'upcoming' | 'later' | 'none'

export function urgencyOf(item: Item): Urgency {
  if (item.status !== 'active') return 'none'
  const n = daysUntil(item.dueDate)
  if (n === null) return 'none'
  if (n < 0) return 'overdue'
  if (n <= 7) return 'due-soon'
  if (n <= 30) return 'upcoming'
  return 'later'
}

const URGENCY_RANK: Record<Urgency, number> = {
  overdue: 0,
  'due-soon': 1,
  upcoming: 2,
  later: 3,
  none: 4,
}

/** A priority score — lower sorts first (more urgent). */
export function priorityScore(item: Item): number {
  const u = urgencyOf(item)
  const n = daysUntil(item.dueDate)
  let score = URGENCY_RANK[u] * 1000
  if (n !== null) score += Math.max(-30, Math.min(365, n))
  // costlier items nudge up within the same urgency band
  if (item.amount) score -= Math.min(item.amount, 2000) / 2000
  return score
}

export function sortByPriority(items: Item[]): Item[] {
  return [...items].sort((a, b) => priorityScore(a) - priorityScore(b))
}

export function sortByDueDate(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const da = daysUntil(a.dueDate)
    const db = daysUntil(b.dueDate)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })
}

/** A short, concrete recommended action line for the item. */
export function actionLine(item: Item): string {
  const meta = CATEGORIES[item.category]
  const when = relativeDue(item.dueDate)
  const amt = item.amount ? ` (${formatMoney(item.amount, item.currency)})` : ''
  const who = item.provider ?? meta.label
  const overdue = urgencyOf(item) === 'overdue'

  switch (item.action) {
    case 'pay':
      return overdue
        ? `Pay ${who}${amt} now — it's ${when}.`
        : `Pay ${who}${amt} — ${when}.`
    case 'renew':
      return `Renew/confirm ${who} ${when}${amt ? ` — was ${formatMoney(item.amount, item.currency)}` : ''}.`
    case 'cancel':
      return `Cancel ${who} before it renews ${when}.`
    case 'dispute':
      return `Dispute the ${who} charge${amt}.`
    case 'call':
      return `Call ${who} ${when}.`
    case 'sign':
      return `Sign / return ${who} paperwork ${when}.`
    case 'review':
      return `Review ${who}${amt} — ${when}.`
    default:
      if (item.category === 'appointment') return `Attend ${who} ${when}.`
      if (item.amount) return `Handle ${who}${amt} — ${when}.`
      return `Follow up on ${who} — ${when}.`
  }
}

export interface Totals {
  monthly: number
  annual: number
  overdueCount: number
  dueSoonCount: number
  activeCount: number
  subsCount: number
  autoPayCount: number
  overdueAmount: number
}

export function computeTotals(items: Item[], _currency?: string): Totals {
  let monthly = 0
  let overdueCount = 0
  let dueSoonCount = 0
  let subsCount = 0
  let autoPayCount = 0
  let overdueAmount = 0
  const active = items.filter((i) => i.status === 'active')
  for (const i of active) {
    if (i.amount && i.recurrence !== 'none') {
      monthly += i.amount * monthlyMultiplier(i.recurrence)
    }
    const u = urgencyOf(i)
    if (u === 'overdue') {
      overdueCount++
      overdueAmount += i.amount ?? 0
    }
    if (u === 'due-soon') dueSoonCount++
    if (i.category === 'subscription') subsCount++
    if (i.autoPay) autoPayCount++
  }
  return {
    monthly,
    annual: monthly * 12,
    overdueCount,
    dueSoonCount,
    activeCount: active.length,
    subsCount,
    autoPayCount,
    overdueAmount,
  }
}

export interface SpendSlice {
  category: Item['category']
  monthly: number
  count: number
}

export function spendByCategory(items: Item[]): SpendSlice[] {
  const map = new Map<Item['category'], SpendSlice>()
  for (const i of items) {
    if (i.status !== 'active') continue
    const monthly =
      i.amount && i.recurrence !== 'none'
        ? i.amount * monthlyMultiplier(i.recurrence)
        : 0
    const slice = map.get(i.category) ?? {
      category: i.category,
      monthly: 0,
      count: 0,
    }
    slice.monthly += monthly
    slice.count += 1
    map.set(i.category, slice)
  }
  return [...map.values()].sort((a, b) => b.monthly - a.monthly)
}

export interface PriceJump {
  item: Item
  from: number
  to: number
  pct: number
}

export function priceJumps(items: Item[]): PriceJump[] {
  const out: PriceJump[] = []
  for (const i of items) {
    if (i.status !== 'active') continue
    const h = i.priceHistory
    if (!h || h.length < 2) continue
    const to = h[h.length - 1].amount
    const from = h[h.length - 2].amount
    if (from <= 0) continue
    const pct = ((to - from) / from) * 100
    if (pct >= 5 && to - from >= 1) out.push({ item: i, from, to, pct })
  }
  return out.sort((a, b) => b.pct - a.pct)
}

export interface DuplicateGroup {
  key: string
  label: string
  items: Item[]
}

const OVERLAP_GROUPS: Array<{ label: string; match: RegExp }> = [
  { label: 'Music streaming', match: /spotify|apple music|tidal|youtube (premium|music)|amazon music/i },
  { label: 'Video streaming', match: /netflix|hulu|disney|max|hbo|paramount|peacock|prime video|apple tv/i },
  { label: 'Cloud storage', match: /icloud|google one|dropbox|onedrive|box/i },
]

export function duplicateGroups(items: Item[]): DuplicateGroup[] {
  const active = items.filter(
    (i) => i.status === 'active' && i.category === 'subscription',
  )
  const groups: DuplicateGroup[] = []

  // Exact-ish same provider more than once
  const byProvider = new Map<string, Item[]>()
  for (const i of active) {
    const key = normalizeName(i.provider || i.title)
    if (!key) continue
    byProvider.set(key, [...(byProvider.get(key) ?? []), i])
  }
  for (const [key, list] of byProvider) {
    if (list.length > 1)
      groups.push({ key: `dup-${key}`, label: 'Duplicate subscription', items: list })
  }

  // Overlapping services of the same type
  for (const g of OVERLAP_GROUPS) {
    const hits = active.filter((i) => g.match.test(`${i.provider} ${i.title}`))
    if (hits.length > 1)
      groups.push({ key: `ovl-${g.label}`, label: g.label, items: hits })
  }
  return groups
}

export function unusedSubscriptions(items: Item[]): Item[] {
  return items.filter(
    (i) =>
      i.status === 'active' &&
      i.category === 'subscription' &&
      (i.usage === 'rarely' || i.usage === 'unknown'),
  )
}
