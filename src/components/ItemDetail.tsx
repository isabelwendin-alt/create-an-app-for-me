import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  FileSignature,
  Hash,
  Pencil,
  RotateCcw,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { addDays, addMonths, format } from 'date-fns'
import type { Item } from '../lib/types'
import { CATEGORIES, RECURRENCE_LABEL } from '../lib/categories'
import { formatDate, formatMoney } from '../lib/format'
import { actionLine } from '../lib/insights'
import { useStore } from '../store'
import { Badge, Button, Modal } from './ui'
import {
  AutoPayBadge,
  CategoryIconBadge,
  UrgencyBadge,
} from './shared'

export function ItemDetailModal({
  item,
  open,
  onClose,
  onEdit,
  onDraft,
}: {
  item: Item
  open: boolean
  onClose: () => void
  onEdit: (item: Item) => void
  onDraft: (item: Item) => void
}) {
  const { setStatus, deleteItem, snooze } = useStore()
  const meta = CATEGORIES[item.category]

  const snoozeTo = (d: Date) => snooze(item.id, format(d, 'yyyy-MM-dd'))

  const del = () => {
    deleteItem(item.id)
    onClose()
  }

  const history = item.priceHistory
  const jump =
    history.length >= 2
      ? history[history.length - 1].amount - history[history.length - 2].amount
      : 0

  return (
    <Modal open={open} onClose={onClose} wide title={item.title} subtitle={item.provider}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryIconBadge category={item.category} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{meta.label}</Badge>
            <UrgencyBadge item={item} />
            <AutoPayBadge item={item} />
            {item.recurrence !== 'none' && (
              <Badge tone="neutral">{RECURRENCE_LABEL[item.recurrence]}</Badge>
            )}
          </div>
        </div>

        {item.status === 'active' && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-500/5 p-3 ring-1 ring-brand-500/20">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {actionLine(item)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Detail label="Amount">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {formatMoney(item.amount, item.currency)}
            </span>
          </Detail>
          <Detail label="Due / renewal">{formatDate(item.dueDate)}</Detail>
          <Detail label="Repeats">{RECURRENCE_LABEL[item.recurrence]}</Detail>
          {item.accountNumber && (
            <Detail label="Account / policy" icon={<Hash className="h-3.5 w-3.5" />}>
              {item.accountNumber}
            </Detail>
          )}
          {item.paymentMethod && (
            <Detail label="Payment" icon={<CreditCard className="h-3.5 w-3.5" />}>
              {item.paymentMethod}
            </Detail>
          )}
          {item.category === 'subscription' && item.usage && (
            <Detail label="Usage">{cap(item.usage)}</Detail>
          )}
        </div>

        {item.actionNote && (
          <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200">
            {item.actionNote}
          </div>
        )}

        {item.notes && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
              {item.notes}
            </p>
          </div>
        )}

        {history.length >= 2 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" /> Price history
            </p>
            <div className="space-y-1.5">
              {history.map((p, i) => (
                <div
                  key={`${p.date}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-sm dark:bg-white/5"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatDate(p.date)}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatMoney(p.amount, item.currency)}
                  </span>
                </div>
              ))}
            </div>
            {jump > 0 && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                Up {formatMoney(jump, item.currency)} since last time — worth a look.
              </p>
            )}
          </div>
        )}

        {item.status === 'active' && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Snooze the due date
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="soft" onClick={() => snoozeTo(addDays(new Date(), 3))}>
                <CalendarPlus className="h-4 w-4" /> +3 days
              </Button>
              <Button size="sm" variant="soft" onClick={() => snoozeTo(addDays(new Date(), 7))}>
                <CalendarPlus className="h-4 w-4" /> +1 week
              </Button>
              <Button size="sm" variant="soft" onClick={() => snoozeTo(addMonths(new Date(), 1))}>
                <CalendarPlus className="h-4 w-4" /> +1 month
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <Button variant="primary" onClick={() => onDraft(item)}>
            <FileSignature className="h-4 w-4" /> Draft action
          </Button>
          <Button variant="soft" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {item.status === 'active' ? (
            <Button variant="soft" onClick={() => setStatus(item.id, 'resolved')}>
              <CheckCircle2 className="h-4 w-4" /> Mark done
            </Button>
          ) : (
            <Button variant="soft" onClick={() => setStatus(item.id, 'active')}>
              <RotateCcw className="h-4 w-4" /> Reopen
            </Button>
          )}
          <Button variant="danger" className="ml-auto" onClick={del}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Detail({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
      <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
