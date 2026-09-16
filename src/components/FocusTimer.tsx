import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw, SkipForward, Coffee, Brain } from 'lucide-react'
import { useStore } from '../store'
import type { SessionType } from '../lib/types'
import { formatClock, uid } from '../lib/utils'
import { playChime } from '../lib/sound'
import { Button, cn } from './ui'

const MODE_LABEL: Record<SessionType, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
}

export default function FocusTimer() {
  const { state, actions } = useStore()
  const { settings, tasks } = state

  const durations = useMemo<Record<SessionType, number>>(
    () => ({
      focus: settings.focusMinutes * 60,
      short: settings.shortBreakMinutes * 60,
      long: settings.longBreakMinutes * 60,
    }),
    [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes],
  )

  const [mode, setMode] = useState<SessionType>('focus')
  const [remaining, setRemaining] = useState(durations.focus)
  const [running, setRunning] = useState(false)
  const [completedFocus, setCompletedFocus] = useState(0)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const endRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const total = durations[mode]
  const openTasks = tasks.filter((t) => !t.done)

  // Reset remaining when mode or its duration changes while not running.
  useEffect(() => {
    if (!running) setRemaining(durations[mode])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, durations[mode]])

  const switchMode = useCallback(
    (next: SessionType) => {
      setRunning(false)
      setMode(next)
      setRemaining(durations[next])
    },
    [durations],
  )

  const handleComplete = useCallback(() => {
    setRunning(false)
    if (settings.soundOn) playChime()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(180)
    }

    actions.addSession({
      id: uid(),
      type: mode,
      minutes: Math.round(durations[mode] / 60),
      finishedAt: Date.now(),
      taskId: mode === 'focus' && activeTaskId ? activeTaskId : undefined,
    })

    if (mode === 'focus') {
      if (activeTaskId) actions.incTaskPomodoro(activeTaskId)
      const nextCount = completedFocus + 1
      setCompletedFocus(nextCount)
      const goLong = nextCount % settings.longBreakInterval === 0
      const nextMode: SessionType = goLong ? 'long' : 'short'
      setMode(nextMode)
      setRemaining(durations[nextMode])
      if (settings.autoStartBreaks) startFor(durations[nextMode])
    } else {
      setMode('focus')
      setRemaining(durations.focus)
      if (settings.autoStartPomodoros) startFor(durations.focus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeTaskId, completedFocus, durations, settings, actions])

  // Animation-frame countdown driven by an absolute end timestamp.
  useEffect(() => {
    if (!running) return
    const tick = () => {
      const secLeft = Math.max(0, (endRef.current - Date.now()) / 1000)
      setRemaining(secLeft)
      if (secLeft <= 0.05) {
        handleComplete()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, handleComplete])

  function startFor(seconds: number) {
    endRef.current = Date.now() + seconds * 1000
    setRemaining(seconds)
    setRunning(true)
  }

  const toggle = () => {
    if (running) {
      setRunning(false)
    } else {
      startFor(remaining <= 0 ? total : remaining)
    }
  }

  const reset = () => {
    setRunning(false)
    setRemaining(total)
  }

  const progress = total > 0 ? 1 - remaining / total : 0
  const size = 280
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const activeTask = openTasks.find((t) => t.id === activeTaskId) ?? null

  // Update the tab title so the countdown is visible when tabbed away.
  useEffect(() => {
    if (running) {
      document.title = `${formatClock(remaining)} · ${MODE_LABEL[mode]} — Momentum`
    } else {
      document.title = 'Momentum · Focus, Tasks & Habits'
    }
    return () => {
      document.title = 'Momentum · Focus, Tasks & Habits'
    }
  }, [running, remaining, mode])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 inline-flex rounded-2xl bg-slate-200/60 p-1 dark:bg-white/5">
        {(['focus', 'short', 'long'] as SessionType[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'no-tap-highlight relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:px-5',
              mode === m
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {m === 'focus' ? (
                <Brain className="h-4 w-4" />
              ) : (
                <Coffee className="h-4 w-4" />
              )}
              {MODE_LABEL[m]}
            </span>
          </button>
        ))}
      </div>

      <div
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-200 dark:stroke-white/10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="url(#timerGradient)"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ ease: 'linear', duration: 0.2 }}
          />
          <defs>
            <linearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex flex-col items-center">
          <div className="font-sans text-6xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {formatClock(remaining)}
          </div>
          <div className="mt-1 text-sm font-medium uppercase tracking-widest text-slate-400">
            {running ? MODE_LABEL[mode] : 'Ready'}
          </div>
          {mode === 'focus' && (
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    i < completedFocus % settings.longBreakInterval ||
                      (completedFocus > 0 &&
                        completedFocus % settings.longBreakInterval === 0)
                      ? 'bg-brand-500'
                      : 'bg-slate-300 dark:bg-white/15',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          aria-label="Reset timer"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          variant="primary"
          onClick={toggle}
          className="h-14 w-40 text-base"
        >
          {running ? (
            <>
              <Pause className="h-5 w-5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" /> Start
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleComplete}
          aria-label="Skip to next"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Working on
        </label>
        {openTasks.length === 0 ? (
          <p className="text-center text-sm text-slate-400">
            No open tasks — add one in the Tasks tab.
          </p>
        ) : (
          <select
            value={activeTaskId ?? ''}
            onChange={(e) => setActiveTaskId(e.target.value || null)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">No task selected</option>
            {openTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        )}
        {activeTask && (
          <p className="mt-2 text-center text-xs text-slate-400">
            {activeTask.donePomodoros}/{activeTask.estPomodoros} pomodoros done
          </p>
        )}
      </div>
    </div>
  )
}
