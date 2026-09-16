import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Category, Item } from '../lib/types'
import { CATEGORIES, CATEGORY_ORDER } from '../lib/categories'
import { formatMoney, monthlyMultiplier } from '../lib/format'
import { sortByDueDate, urgencyOf } from '../lib/insights'
import { useStore } from '../store'
import { Button, EmptyState, Input, cn } from './ui'
import { ItemRow } from './ItemRow'

type StatusFilter = 'active' | 'resolved' | 'all'

export function Tracker({
  onOpen,
  onAdd,
}: {
  onOpen: (item: Item) => void
  onAdd: () => void
}) {
  const { state } = useStore()
  const currency = state.settings.currency
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('active')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.items.filter((i) => {
      if (status === 'active' && i.status !== 'active') return false
      if (status === 'resolved' && i.status !== 'resolved') return false
      if (cat !== 'all' && i.category !== cat) return false
      if (q) {
        const hay = `${i.title} ${i.provider ?? ''} ${i.accountNumber ?? ''} ${CATEGORIES[i.category].label}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [state.items, query, cat, status])

  const groups = useMemo(() => {
    const map = new Map<Category, Item[]>()
    for (const i of filtered) {
      map.set(i.category, [...(map.get(i.category) ?? []), i])
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: sortByDueDate(map.get(c)!),
    }))
  }, [filtered])

  const overdueTop = useMemo(
    () =>
      sortByDueDate(filtered.filter((i) => urgencyOf(i) === 'overdue')),
    [filtered],
  )

  const catCounts = useMemo(() => {
    const m = new Map<Category, number>()
    for (const i of state.items) {
      if (status === 'active' && i.status !== 'active') continue
      if (status === 'resolved' && i.status !== 'resolved') continue
      m.set(i.category, (m.get(i.category) ?? 0) + 1)
    }
    return m
  }, [state.items, status])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Everything you track
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Grouped by category, soonest due first.
          </p>
        </div>
        <Button variant="primary" onClick={onAdd} className="self-start">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, provider, or account #"
            className="pl-9"
          />
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {(['active', 'resolved', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition',
                status === s
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-800 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={cat === 'all'} onClick={() => setCat('all')}>
          All
        </FilterChip>
        {CATEGORY_ORDER.filter((c) => catCounts.get(c)).map((c) => {
          const meta = CATEGORIES[c]
          const Icon = meta.icon
          return (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
              <span className="opacity-60">{catCounts.get(c)}</span>
            </FilterChip>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Nothing here">
          {query || cat !== 'all'
            ? 'No items match your filters.'
            : 'Add your first bill, policy, or subscription to get started.'}
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {overdueTop.length > 0 && cat === 'all' && (
            <section>
              <SectionHeader
                title="⚠️ Overdue"
                right={`${overdueTop.length} item${overdueTop.length > 1 ? 's' : ''}`}
                danger
              />
              <div className="space-y-2">
                {overdueTop.map((item) => (
                  <ItemRow key={item.id} item={item} onOpen={onOpen} />
                ))}
              </div>
            </section>
          )}

          {groups.map((g) => {
            const meta = CATEGORIES[g.category]
            const monthly = g.items.reduce(
              (sum, i) =>
                sum +
                (i.amount && i.recurrence !== 'none'
                  ? i.amount * monthlyMultiplier(i.recurrence)
                  : 0),
              0,
            )
            return (
              <section key={g.category}>
                <SectionHeader
                  title={meta.label}
                  right={
                    monthly > 0
                      ? `${formatMoney(monthly, currency)}/mo`
                      : `${g.items.length}`
                  }
                />
                <div className="space-y-2">
                  {g.items.map((item) => (
                    <ItemRow key={item.id} item={item} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  right,
  danger,
}: {
  title: string
  right?: string
  danger?: boolean
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2
        className={cn(
          'text-sm font-bold uppercase tracking-wide',
          danger
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {title}
      </h2>
      {right && (
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {right}
        </span>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}
