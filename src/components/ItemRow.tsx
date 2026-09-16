import { ChevronRight } from 'lucide-react'
import type { Item } from '../lib/types'
import { formatMoney } from '../lib/format'
import { RECURRENCE_LABEL } from '../lib/categories'
import { AutoPayBadge, CategoryIconBadge, UrgencyBadge } from './shared'
import { cn } from './ui'

export function ItemRow({
  item,
  onOpen,
}: {
  item: Item
  onOpen: (item: Item) => void
}) {
  return (
    <button
      onClick={() => onOpen(item)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-left transition hover:border-brand-400/60 hover:bg-brand-500/[0.03] hover:shadow-sm dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-brand-400/40',
        item.status === 'resolved' && 'opacity-60',
      )}
    >
      <CategoryIconBadge category={item.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {item.title}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <UrgencyBadge item={item} />
          <AutoPayBadge item={item} />
          {item.recurrence !== 'none' && (
            <span className="text-xs text-slate-400">
              {RECURRENCE_LABEL[item.recurrence]}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pl-1">
        {item.amount != null && (
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {formatMoney(item.amount, item.currency)}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600" />
      </div>
    </button>
  )
}
