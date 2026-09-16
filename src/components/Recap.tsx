import { useMemo } from 'react'
import { Check, ClipboardCheck, Copy } from 'lucide-react'
import type { Item } from '../lib/types'
import { formatMoney, relativeDue, daysUntil, formatDate } from '../lib/format'
import { actionLine, computeTotals, sortByPriority } from '../lib/insights'
import { useStore } from '../store'
import { Button, Card, EmptyState } from './ui'
import { ItemRow } from './ItemRow'
import { useCopy } from './shared'

export function Recap({ onOpen }: { onOpen: (item: Item) => void }) {
  const { state } = useStore()
  const currency = state.settings.currency
  const [copied, copy] = useCopy()

  const active = state.items.filter((i) => i.status === 'active')

  const overdue = useMemo(
    () => sortByPriority(active.filter((i) => (daysUntil(i.dueDate) ?? 1) < 0)),
    [active],
  )
  const next2Weeks = useMemo(
    () =>
      sortByPriority(
        active.filter((i) => {
          const n = daysUntil(i.dueDate)
          return n !== null && n >= 0 && n <= 14
        }),
      ),
    [active],
  )
  const recentlyResolved = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14
    return state.items
      .filter((i) => i.status === 'resolved' && (i.resolvedAt ?? 0) >= cutoff)
      .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
  }, [state.items])

  const totals = useMemo(
    () => computeTotals(state.items, currency),
    [state.items, currency],
  )

  const summary = useMemo(() => {
    const lines: string[] = []
    lines.push(`State of my admin — ${formatDate(new Date().toISOString().slice(0, 10))}`)
    lines.push('')
    if (overdue.length) {
      lines.push(`OVERDUE (${overdue.length}):`)
      overdue.forEach((i) => lines.push(`  • ${actionLine(i)}`))
      lines.push('')
    }
    if (next2Weeks.length) {
      lines.push(`DUE IN THE NEXT 2 WEEKS (${next2Weeks.length}):`)
      next2Weeks.forEach((i) =>
        lines.push(
          `  • ${i.title} — ${relativeDue(i.dueDate)}${i.amount ? ` (${formatMoney(i.amount, i.currency)})` : ''}`,
        ),
      )
      lines.push('')
    }
    if (recentlyResolved.length) {
      lines.push(`RESOLVED RECENTLY (${recentlyResolved.length}):`)
      recentlyResolved.forEach((i) => lines.push(`  • ${i.title}`))
      lines.push('')
    }
    lines.push(
      `Recurring spend: ${formatMoney(totals.monthly, currency)}/mo (≈ ${formatMoney(totals.annual, currency)}/yr).`,
    )
    return lines.join('\n')
  }, [overdue, next2Weeks, recentlyResolved, totals, currency])

  const allClear = overdue.length === 0 && next2Weeks.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            State of your admin
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A quick recap you can copy and keep.
          </p>
        </div>
        <Button variant="primary" onClick={() => copy(summary)} className="self-start">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy recap'}
        </Button>
      </div>

      {allClear && recentlyResolved.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="You're all caught up">
          Nothing overdue and nothing due in the next two weeks. Beautiful.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecapColumn
            title="Overdue"
            tone="text-rose-600 dark:text-rose-400"
            count={overdue.length}
            empty="Nothing overdue. 🎉"
          >
            {overdue.map((i) => (
              <ItemRow key={i.id} item={i} onOpen={onOpen} />
            ))}
          </RecapColumn>

          <RecapColumn
            title="Next 2 weeks"
            tone="text-amber-600 dark:text-amber-400"
            count={next2Weeks.length}
            empty="Clear for the next two weeks."
          >
            {next2Weeks.map((i) => (
              <ItemRow key={i.id} item={i} onOpen={onOpen} />
            ))}
          </RecapColumn>

          <RecapColumn
            title="Resolved recently"
            tone="text-emerald-600 dark:text-emerald-400"
            count={recentlyResolved.length}
            empty="Nothing resolved in the last 2 weeks."
          >
            {recentlyResolved.map((i) => (
              <ItemRow key={i.id} item={i} onOpen={onOpen} />
            ))}
          </RecapColumn>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              At a glance
            </h3>
            <dl className="space-y-2.5 text-sm">
              <Row label="Overdue" value={String(overdue.length)} />
              <Row label="Due next 2 weeks" value={String(next2Weeks.length)} />
              <Row
                label="Recurring spend"
                value={`${formatMoney(totals.monthly, currency)}/mo`}
              />
              <Row
                label="Annualized"
                value={`${formatMoney(totals.annual, currency)}/yr`}
              />
              <Row label="On auto-pay" value={String(totals.autoPayCount)} />
              <Row label="Active items" value={String(totals.activeCount)} />
            </dl>
          </Card>
        </div>
      )}
    </div>
  )
}

function RecapColumn({
  title,
  tone,
  count,
  empty,
  children,
}: {
  title: string
  tone: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`text-sm font-bold uppercase tracking-wide ${tone}`}>
          {title}
        </h2>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400 dark:border-white/10">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  )
}
