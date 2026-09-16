import { useMemo } from 'react'
import {
  Copy,
  FileSignature,
  Lightbulb,
  PiggyBank,
  Repeat,
  TrendingUp,
} from 'lucide-react'
import type { Item } from '../lib/types'
import { CATEGORIES } from '../lib/categories'
import { formatMoney, monthlyMultiplier } from '../lib/format'
import {
  computeTotals,
  duplicateGroups,
  priceJumps,
  spendByCategory,
  unusedSubscriptions,
} from '../lib/insights'
import { useStore } from '../store'
import { Badge, Button, Card, EmptyState } from './ui'
import { CategoryIconBadge } from './shared'

export function Insights({
  onOpen,
  onDraft,
}: {
  onOpen: (item: Item) => void
  onDraft: (item: Item) => void
}) {
  const { state } = useStore()
  const currency = state.settings.currency

  const jumps = useMemo(() => priceJumps(state.items), [state.items])
  const dups = useMemo(() => duplicateGroups(state.items), [state.items])
  const unused = useMemo(() => unusedSubscriptions(state.items), [state.items])
  const spend = useMemo(() => spendByCategory(state.items), [state.items])
  const totals = useMemo(
    () => computeTotals(state.items, currency),
    [state.items, currency],
  )

  const potentialSavings = useMemo(() => {
    let s = 0
    for (const i of unused) {
      if (i.amount && i.recurrence !== 'none')
        s += i.amount * monthlyMultiplier(i.recurrence)
    }
    // count only the cheaper of each overlap group as a candidate saving
    for (const g of dups) {
      const sorted = [...g.items].sort(
        (a, b) =>
          (b.amount ?? 0) * monthlyMultiplier(b.recurrence) -
          (a.amount ?? 0) * monthlyMultiplier(a.recurrence),
      )
      for (const i of sorted.slice(1)) {
        if (i.amount && i.recurrence !== 'none')
          s += i.amount * monthlyMultiplier(i.recurrence)
      }
    }
    return s
  }, [unused, dups])

  const nothing =
    jumps.length === 0 && dups.length === 0 && unused.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Insights &amp; savings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Where I’d look to save money and cut waste.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <PiggyBank className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatMoney(potentialSavings, currency)}
            <span className="text-base font-medium text-slate-400">/mo</span>
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Potential savings
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            From unused &amp; overlapping subs
          </p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <Repeat className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatMoney(totals.monthly, currency)}
            <span className="text-base font-medium text-slate-400">/mo</span>
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total recurring
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            ≈ {formatMoney(totals.annual, currency)} a year
          </p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {jumps.length}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Price increases
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Since you last logged them</p>
        </Card>
      </div>

      {nothing && (
        <EmptyState icon={<Lightbulb className="h-6 w-6" />} title="No flags right now">
          I’ll surface price jumps, duplicate subscriptions, and unused services
          here as your list grows.
        </EmptyState>
      )}

      {jumps.length > 0 && (
        <section>
          <SectionTitle
            icon={<TrendingUp className="h-4 w-4" />}
            title="Prices that went up"
          />
          <div className="space-y-2.5">
            {jumps.map(({ item, from, to, pct }) => (
              <Card key={item.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <CategoryIconBadge category={item.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpen(item)}
                        className="text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {item.title}
                      </button>
                      <Badge tone="rose">+{pct.toFixed(0)}%</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Up from {formatMoney(from, currency)} to{' '}
                      <strong>{formatMoney(to, currency)}</strong>. Worth asking why —
                      and getting a couple of competing quotes before it renews.
                    </p>
                  </div>
                  <Button size="sm" variant="soft" onClick={() => onDraft(item)}>
                    <FileSignature className="h-4 w-4" /> Draft
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {dups.length > 0 && (
        <section>
          <SectionTitle
            icon={<Copy className="h-4 w-4" />}
            title="Possible overlap or duplicates"
          />
          <div className="space-y-2.5">
            {dups.map((g) => (
              <Card key={g.key} className="p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="amber">{g.label}</Badge>
                  <span className="text-xs text-slate-400">
                    {g.items.length} services
                  </span>
                </div>
                <div className="space-y-1.5">
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onOpen(item)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-sm transition hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.title}
                      </span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {item.amount != null
                          ? `${formatMoney(item.amount, item.currency)}/${item.recurrence === 'yearly' ? 'yr' : 'mo'}`
                          : ''}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Do you use all of these? Keeping one could trim the rest.
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {unused.length > 0 && (
        <section>
          <SectionTitle
            icon={<Lightbulb className="h-4 w-4" />}
            title="Rarely used — candidates to cancel"
          />
          <div className="space-y-2.5">
            {unused.map((item) => (
              <Card key={item.id} className="p-3.5">
                <div className="flex items-center gap-3">
                  <CategoryIconBadge category={item.category} />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onOpen(item)}
                      className="text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                    >
                      {item.title}
                    </button>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {item.amount != null
                        ? `${formatMoney(item.amount, item.currency)}/${item.recurrence === 'yearly' ? 'yr' : 'mo'} · `
                        : ''}
                      marked “{item.usage}”. Cancel if you’re not getting value.
                    </p>
                  </div>
                  <Button size="sm" variant="soft" onClick={() => onDraft(item)}>
                    <FileSignature className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {spend.some((s) => s.monthly > 0) && (
        <section>
          <SectionTitle
            icon={<PiggyBank className="h-4 w-4" />}
            title="Monthly spend by category"
          />
          <Card className="divide-y divide-slate-200/70 dark:divide-white/5">
            {spend
              .filter((s) => s.monthly > 0)
              .map((s) => {
                const meta = CATEGORIES[s.category]
                return (
                  <div
                    key={s.category}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: meta.hex }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        · {s.count} item{s.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(s.monthly, currency)}/mo
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatMoney(s.monthly * 12, currency)}/yr
                      </p>
                    </div>
                  </div>
                )
              })}
          </Card>
        </section>
      )}
    </div>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {icon}
      {title}
    </h2>
  )
}
