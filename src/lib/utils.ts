import { format, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns'

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const dayKey = (d: Date | number = new Date()) =>
  format(typeof d === 'number' ? new Date(d) : d, 'yyyy-MM-dd')

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export const pad = (n: number) => n.toString().padStart(2, '0')

export const formatClock = (totalSeconds: number) => {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${pad(m)}:${pad(sec)}`
}

/** Returns array of Date for the current week starting Monday */
export const weekDays = (base: Date = new Date()) => {
  const start = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Last `n` days as Date[], oldest first, ending today */
export const lastNDays = (n: number, base: Date = new Date()) =>
  Array.from({ length: n }, (_, i) => addDays(base, i - (n - 1)))

/** Longest current streak of consecutive completed days ending today */
export function currentStreak(history: Record<string, boolean>): number {
  let streak = 0
  let cursor = new Date()
  // allow streak to hold if today not yet done but yesterday was
  if (!history[dayKey(cursor)]) {
    cursor = addDays(cursor, -1)
  }
  while (history[dayKey(cursor)]) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Best (longest ever) streak in a habit's history */
export function bestStreak(history: Record<string, boolean>): number {
  const days = Object.keys(history)
    .filter((k) => history[k])
    .map((k) => new Date(k))
    .sort((a, b) => a.getTime() - b.getTime())
  if (days.length === 0) return 0
  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const diff = differenceInCalendarDays(days[i], days[i - 1])
    if (diff === 1) {
      run++
      best = Math.max(best, run)
    } else if (diff > 1) {
      run = 1
    }
  }
  return best
}

export const HABIT_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
]

export const HABIT_EMOJI = [
  '💧',
  '🏃',
  '📚',
  '🧘',
  '🥗',
  '😴',
  '✍️',
  '🎯',
  '🧹',
  '🎸',
  '💊',
  '☀️',
]
