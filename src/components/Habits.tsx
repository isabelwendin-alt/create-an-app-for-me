import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, isToday, isFuture } from 'date-fns'
import { Plus, Trash2, Flame, Trophy, X, Check } from 'lucide-react'
import { useStore } from '../store'
import type { Habit } from '../lib/types'
import {
  bestStreak,
  currentStreak,
  dayKey,
  HABIT_COLORS,
  HABIT_EMOJI,
  weekDays,
} from '../lib/utils'
import { Button, Card, cn } from './ui'

export default function Habits() {
  const { state } = useStore()
  const [adding, setAdding] = useState(false)
  const days = useMemo(() => weekDays(), [])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            This week
          </h2>
          <p className="text-sm text-slate-400">
            {format(days[0], 'MMM d')} – {format(days[6], 'MMM d')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> New habit
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-3 px-3">
        <span />
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={cn(
                'w-9 text-center text-[11px] font-bold uppercase',
                isToday(d) ? 'text-brand-500' : 'text-slate-400',
              )}
            >
              {format(d, 'EEEEE')}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {state.habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} days={days} />
          ))}
        </AnimatePresence>
        {state.habits.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400 dark:border-white/10">
            No habits yet. Build your first one 🌱
          </div>
        )}
      </div>

      <AnimatePresence>
        {adding && <AddHabit onClose={() => setAdding(false)} />}
      </AnimatePresence>
    </div>
  )
}

function HabitRow({ habit, days }: { habit: Habit; days: Date[] }) {
  const { actions } = useStore()
  const streak = currentStreak(habit.history)
  const best = bestStreak(habit.history)
  const doneThisWeek = days.filter((d) => habit.history[dayKey(d)]).length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="group grid grid-cols-[1fr_auto] items-center gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            {habit.emoji}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {habit.name}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Flame
                  className="h-3 w-3"
                  style={{ color: streak > 0 ? '#f59e0b' : undefined }}
                />
                {streak}d streak
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                best {best}
              </span>
              <span
                className={cn(
                  doneThisWeek >= habit.targetPerWeek && 'text-emerald-500',
                )}
              >
                {doneThisWeek}/{habit.targetPerWeek} this week
              </span>
              <button
                onClick={() => actions.deleteHabit(habit.id)}
                className="opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                aria-label="Delete habit"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const key = dayKey(d)
            const done = !!habit.history[key]
            const future = isFuture(d) && !isToday(d)
            return (
              <button
                key={key}
                disabled={future}
                onClick={() => actions.toggleHabit(habit.id, key)}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-xl border-2 transition-all active:scale-90 disabled:opacity-30',
                  done
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-slate-200 text-transparent hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
                  isToday(d) && !done && 'ring-2 ring-brand-400/40',
                )}
                style={done ? { backgroundColor: habit.color } : undefined}
                aria-label={`${habit.name} on ${format(d, 'EEEE')}`}
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </button>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}

function AddHabit({ onClose }: { onClose: () => void }) {
  const { actions } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(HABIT_EMOJI[0])
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [target, setTarget] = useState(5)

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    actions.addHabit({ name: trimmed, emoji, color, targetPerWeek: target })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            New habit
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
              style={{ backgroundColor: `${color}22` }}
            >
              {emoji}
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="Habit name…"
              className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Icon
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_EMOJI.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-lg text-lg transition',
                    emoji === e
                      ? 'bg-slate-200 ring-2 ring-brand-400 dark:bg-white/10'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Color
            </p>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition',
                    color === c
                      ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                      : '',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Weekly goal
            </p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={7}
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value, 10))}
                className="accent-brand-500"
              />
              <span className="w-16 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                {target}× / wk
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={save}
            disabled={!name.trim()}
          >
            Create habit
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
