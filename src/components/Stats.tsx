import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { isSameDay, isThisWeek, format } from 'date-fns'
import {
  Timer,
  CheckCircle2,
  Flame,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store'
import { dayKey, lastNDays, currentStreak } from '../lib/utils'
import { Card, cn } from './ui'

export default function Stats() {
  const { state } = useStore()
  const { sessions, tasks, habits } = state

  const focusSessions = useMemo(
    () => sessions.filter((s) => s.type === 'focus'),
    [sessions],
  )

  const now = new Date()

  const minutesToday = focusSessions
    .filter((s) => isSameDay(s.finishedAt, now))
    .reduce((sum, s) => sum + s.minutes, 0)

  const minutesWeek = focusSessions
    .filter((s) => isThisWeek(s.finishedAt, { weekStartsOn: 1 }))
    .reduce((sum, s) => sum + s.minutes, 0)

  const tasksDoneToday = tasks.filter(
    (t) => t.done && t.completedAt && isSameDay(t.completedAt, now),
  ).length

  // Focus-day streak: consecutive days ending today with at least one focus session.
  const focusHistory = useMemo(() => {
    const map: Record<string, boolean> = {}
    focusSessions.forEach((s) => {
      map[dayKey(s.finishedAt)] = true
    })
    return map
  }, [focusSessions])
  const focusStreak = currentStreak(focusHistory)

  // Habit completion rate this week.
  const habitRate = useMemo(() => {
    const days = lastNDays(7)
    let done = 0
    let target = 0
    habits.forEach((h) => {
      target += h.targetPerWeek
      done += days.filter((d) => h.history[dayKey(d)]).length
    })
    if (target === 0) return 0
    return Math.min(1, done / target)
  }, [habits])

  const last14 = useMemo(() => {
    const days = lastNDays(14)
    return days.map((d) => {
      const mins = focusSessions
        .filter((s) => isSameDay(s.finishedAt, d))
        .reduce((sum, s) => sum + s.minutes, 0)
      return { date: d, minutes: mins }
    })
  }, [focusSessions])

  const maxMinutes = Math.max(60, ...last14.map((d) => d.minutes))
  const totalHours = (
    focusSessions.reduce((s, x) => s + x.minutes, 0) / 60
  ).toFixed(1)

  const cards: {
    icon: LucideIcon
    label: string
    value: string
    accent: string
    sub: string
  }[] = [
    {
      icon: Timer,
      label: 'Focus today',
      value: `${minutesToday}m`,
      accent: 'text-brand-500 bg-brand-500/10',
      sub: `${minutesWeek}m this week`,
    },
    {
      icon: Flame,
      label: 'Focus streak',
      value: `${focusStreak}`,
      accent: 'text-amber-500 bg-amber-500/10',
      sub: focusStreak === 1 ? 'day in a row' : 'days in a row',
    },
    {
      icon: CheckCircle2,
      label: 'Tasks done today',
      value: `${tasksDoneToday}`,
      accent: 'text-emerald-500 bg-emerald-500/10',
      sub: `${tasks.filter((t) => t.done).length} all-time`,
    },
    {
      icon: Target,
      label: 'Habit goals',
      value: `${Math.round(habitRate * 100)}%`,
      accent: 'text-pink-500 bg-pink-500/10',
      sub: 'of weekly targets',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div
                className={cn(
                  'mb-3 grid h-9 w-9 place-items-center rounded-xl',
                  c.accent,
                )}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-extrabold tabular-nums text-slate-800 dark:text-white">
                {c.value}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                {c.label}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Focus — last 14 days
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {totalHours}h all time
          </span>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {last14.map((d) => {
            const h = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0
            const today = isSameDay(d.date, now)
            return (
              <div
                key={d.date.toISOString()}
                className="group relative flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    className={cn(
                      'w-full rounded-md',
                      d.minutes > 0
                        ? today
                          ? 'bg-gradient-to-t from-brand-600 to-brand-400'
                          : 'bg-slate-300 dark:bg-white/15'
                        : 'bg-slate-100 dark:bg-white/5',
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(d.minutes > 0 ? 6 : 3, h)}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    today ? 'text-brand-500' : 'text-slate-400',
                  )}
                >
                  {format(d.date, 'EEEEE')}
                </span>
                {d.minutes > 0 && (
                  <div className="pointer-events-none absolute -top-7 z-10 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                    {d.minutes}m
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {sessions.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">
          Complete a focus session to start building your stats 📈
        </p>
      )}
    </div>
  )
}
