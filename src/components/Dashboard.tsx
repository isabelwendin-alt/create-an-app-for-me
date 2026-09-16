import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileSignature,
  Layers,
  Plus,
  Wallet,
} from 'lucide-react'
import type { Item } from '../lib/types'
import { CATEGORIES } from '../lib/categories'
import { formatMoney } from '../lib/format'
import {
  actionLine,
  computeTotals,
  sortByPriority,
  spendByCategory,
  urgencyOf,
} from '../lib/insights'
import { useStore } from '../store'
import { Button, Card, EmptyState, cn } from './ui'
import { CategoryIconBadge, UrgencyBadge } from './shared'
import { ItemRow } from './ItemRow'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard({
  onOpen,
  onDraft,
  onAdd,
  onGoTracker,
}: {
  onOpen: (item: Item) => void
  onDraft: (item: Item) => void
  onAdd: () => void
  onGoTracker: () => void
}) {
  const { state } = useStore()
  const currency = state.settings.currency
  const totals = useMemo(
    () => computeTotals(state.items, currency),
    [state.items, currency],
  )

  const active = state.items.filter((i) => i.status === 'active')
  const attention = useMemo(
    () =>
      sortByPriority(
        active.filter((i) => {
          const u = urgencyOf(i)
          return u === 'overdue' || u === 'due-soon'
        }),
      ),
    [active],
  )
  const upcoming = useMemo(
    () =>
      sortByPriority(active.filter((i) => urgencyOf(i) === 'upcoming')).slice(0, 5),
    [active],
  )
  const spend = useMemo(() => spendByCategory(state.items), [state.items])
  const maxSpend = Math.max(1, ...spend.map((s) => s.monthly))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {greeting()}.
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {attention.length > 0
              ? `You have ${attention.length} thing${attention.length > 1 ? 's' : ''} that need${attention.length > 1 ? '' : 's'} attention soon.`
              : 'Nothing urgent right now — you’re on top of it. ✨'}
          </p>
        </div>
        <Button variant="primary" onClick={onAdd} className="self-start">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          tone={totals.overdueCount ? 'rose' : 'emerald'}
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Needs attention"
          value={String(totals.overdueCount + totals.dueSoonCount)}
          sub={
            totals.overdueCount
              ? `${totals.overdueCount} overdue · ${formatMoney(totals.overdueAmount, currency)}`
              : 'Overdue or due ≤ 7 days'
          }
        />
        <Stat
          tone="brand"
          icon={<Wallet className="h-4 w-4" />}
          label="Monthly recurring"
          value={formatMoney(totals.monthly, currency)}
          sub={`≈ ${formatMoney(totals.annual, currency)} / year`}
        />
        <Stat
          tone="sky"
          icon={<Layers className="h-4 w-4" />}
          label="Tracked items"
          value={String(totals.activeCount)}
          sub={`${totals.subsCount} subscriptions`}
        />
        <Stat
          tone="violet"
          icon={<CalendarClock className="h-4 w-4" />}
          label="On auto-pay"
          value={String(totals.autoPayCount)}
          sub="Charged automatically"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              Needs attention now
            </h2>
            <Button variant="ghost" size="sm" onClick={onGoTracker}>
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {attention.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-6 w-6" />}
              title="All clear"
            >
              Nothing overdue or due in the next 7 days. Add more items so nothing
              slips through.
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {attention.map((item) => (
                <PriorityCard
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  onDraft={onDraft}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              Coming up next
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nothing in the next 30 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((item) => (
                  <ItemRow key={item.id} item={item} onOpen={onOpen} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              Where the money goes
            </h3>
            {spend.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No recurring costs tracked yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {spend
                  .filter((s) => s.monthly > 0)
                  .slice(0, 6)
                  .map((s) => {
                    const meta = CATEGORIES[s.category]
                    return (
                      <div key={s.category}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {meta.label}
                          </span>
                          <span className="tabular-nums text-slate-500 dark:text-slate-400">
                            {formatMoney(s.monthly, currency)}/mo
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(s.monthly / maxSpend) * 100}%`,
                              backgroundColor: meta.hex,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function PriorityCard({
  item,
  onOpen,
  onDraft,
}: {
  item: Item
  onOpen: (item: Item) => void
  onDraft: (item: Item) => void
}) {
  const overdue = urgencyOf(item) === 'overdue'
  return (
    <Card
      className={cn(
        'p-3.5 transition hover:shadow-md',
        overdue && 'ring-1 ring-rose-500/30',
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIconBadge category={item.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpen(item)}
              className="truncate text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
            >
              {item.title}
            </button>
            <UrgencyBadge item={item} />
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {actionLine(item)}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onDraft(item)}>
          <FileSignature className="h-4 w-4" /> Draft
        </Button>
        <Button size="sm" variant="soft" onClick={() => onOpen(item)}>
          Open <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

const statTones: Record<string, string> = {
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
}

function Stat({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: keyof typeof statTones | string
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <Card className="p-4">
      <div
        className={cn(
          'mb-3 grid h-9 w-9 place-items-center rounded-xl',
          statTones[tone] ?? statTones.brand,
        )}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>
    </Card>
  )
}
