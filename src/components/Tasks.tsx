import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  GripVertical,
  Plus,
  Trash2,
  Flame,
  CircleDot,
} from 'lucide-react'
import { useStore } from '../store'
import type { Priority, Task } from '../lib/types'
import { Button, Card, cn } from './ui'

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; ring: string }
> = {
  high: { label: 'High', dot: 'bg-rose-500', ring: 'text-rose-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500', ring: 'text-amber-500' },
  low: { label: 'Low', dot: 'bg-emerald-500', ring: 'text-emerald-500' },
}

type Filter = 'all' | 'active' | 'done'

export default function Tasks() {
  const { state, actions } = useStore()
  const { tasks } = state

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [est, setEst] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const dragId = useRef<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.done)
    if (filter === 'done') return tasks.filter((t) => t.done)
    return tasks
  }, [tasks, filter])

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.done).length
    return { done, total: tasks.length, pct: tasks.length ? done / tasks.length : 0 }
  }, [tasks])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    actions.addTask(trimmed, priority, Math.max(1, est))
    setTitle('')
    setEst(1)
    setPriority('medium')
  }

  const onDrop = (targetId: string) => {
    const from = dragId.current
    setDragOver(null)
    dragId.current = null
    if (!from || from === targetId) return
    const ids = tasks.map((t) => t.id)
    const fromIdx = ids.indexOf(from)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx < 0 || toIdx < 0) return
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0])
    actions.reorderTasks(ids)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={submit} className="mb-5">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <Plus className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task…"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!title.trim()}>
              Add
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 px-1 pt-2 dark:border-white/5">
            <div className="flex items-center gap-1">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    priority === p
                      ? 'bg-slate-200/80 text-slate-800 dark:bg-white/10 dark:text-white'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', PRIORITY_META[p].dot)} />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <CircleDot className="h-3.5 w-3.5" />
              <span>Est.</span>
              <input
                type="number"
                min={1}
                max={12}
                value={est}
                onChange={(e) => setEst(parseInt(e.target.value || '1', 10))}
                className="w-12 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-slate-700 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              />
              <span>🍅</span>
            </div>
          </div>
        </Card>
      </form>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-white/5">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition',
                filter === f
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <span>
            {stats.done}/{stats.total} done
          </span>
          {stats.done > 0 && (
            <button
              onClick={actions.clearCompleted}
              className="font-semibold text-slate-400 transition hover:text-rose-500"
            >
              Clear done
            </button>
          )}
        </div>
      </div>

      {stats.total > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            animate={{ width: `${stats.pct * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              dragOver={dragOver === task.id}
              onDragStart={() => (dragId.current = task.id)}
              onDragEnter={() => setDragOver(task.id)}
              onDragEnd={() => setDragOver(null)}
              onDrop={() => onDrop(task.id)}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400 dark:border-white/10">
            {filter === 'done'
              ? 'Nothing completed yet — get after it.'
              : 'No tasks here. Add your first above ✨'}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  dragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: {
  task: Task
  dragOver: boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  onDrop: () => void
}) {
  const { actions } = useStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== task.title) {
      actions.updateTask(task.id, { title: trimmed })
    } else {
      setDraft(task.title)
    }
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.18 }}
      draggable={!editing}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border bg-white/80 px-3 py-3 shadow-sm transition dark:bg-slate-900/50',
        dragOver
          ? 'border-brand-400 ring-2 ring-brand-400/30'
          : 'border-slate-200/80 dark:border-white/10',
      )}
    >
      <button
        className="cursor-grab text-slate-300 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing dark:text-slate-600"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => actions.toggleTask(task.id)}
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition',
          task.done
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600',
        )}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(task.title)
                setEditing(false)
              }
            }}
            className="w-full rounded-lg bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:bg-white/10 dark:text-white"
          />
        ) : (
          <button
            onDoubleClick={() => setEditing(true)}
            className="block w-full truncate text-left text-sm font-medium"
          >
            <span
              className={cn(
                task.done
                  ? 'text-slate-400 line-through'
                  : 'text-slate-800 dark:text-slate-100',
              )}
            >
              {task.title}
            </span>
          </button>
        )}
        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_META[task.priority].dot)} />
            {PRIORITY_META[task.priority].label}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {task.donePomodoros}/{task.estPomodoros}
          </span>
        </div>
      </div>

      <button
        onClick={() => actions.deleteTask(task.id)}
        className="rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
