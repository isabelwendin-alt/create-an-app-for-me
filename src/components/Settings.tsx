import { useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Upload, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { AppState, Settings as SettingsType } from '../lib/types'
import { Button, cn } from './ui'

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="h-9 w-9 rounded-l-xl text-lg font-bold text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/5"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
            {value}
          </span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="h-9 w-9 rounded-r-xl text-lg font-bold text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/5"
          >
            +
          </button>
        </div>
        {suffix && (
          <span className="w-8 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2.5"
    >
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/15',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? 22 : 2 }}
        />
      </span>
    </button>
  )
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, actions } = useStore()
  const { settings } = state
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<SettingsType>) => actions.updateSettings(patch)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState
        if (parsed && parsed.tasks && parsed.habits) {
          actions.importState(parsed)
          onClose()
        } else {
          alert('That file does not look like a Momentum backup.')
        }
      } catch {
        alert('Could not read that file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Settings
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <section className="mb-6">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Timer
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <NumberField
              label="Focus length"
              value={settings.focusMinutes}
              onChange={(v) => set({ focusMinutes: v })}
              min={5}
              max={90}
              suffix="min"
            />
            <NumberField
              label="Short break"
              value={settings.shortBreakMinutes}
              onChange={(v) => set({ shortBreakMinutes: v })}
              min={1}
              max={30}
              suffix="min"
            />
            <NumberField
              label="Long break"
              value={settings.longBreakMinutes}
              onChange={(v) => set({ longBreakMinutes: v })}
              min={5}
              max={45}
              suffix="min"
            />
            <NumberField
              label="Long break every"
              value={settings.longBreakInterval}
              onChange={(v) => set({ longBreakInterval: v })}
              min={2}
              max={8}
              suffix="🍅"
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Behaviour
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <Toggle
              label="Auto-start breaks"
              checked={settings.autoStartBreaks}
              onChange={(v) => set({ autoStartBreaks: v })}
            />
            <Toggle
              label="Auto-start focus"
              checked={settings.autoStartPomodoros}
              onChange={(v) => set({ autoStartPomodoros: v })}
            />
            <Toggle
              label="Chime on completion"
              checked={settings.soundOn}
              onChange={(v) => set({ soundOn: v })}
            />
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Data
          </h3>
          <div className="space-y-2">
            <Button variant="soft" className="w-full justify-start" onClick={exportData}>
              <Download className="h-4 w-4" /> Export backup
            </Button>
            <Button
              variant="soft"
              className="w-full justify-start"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importData(file)
                e.target.value = ''
              }}
            />
            <Button
              variant="danger"
              className="w-full justify-start"
              onClick={() => {
                if (
                  confirm(
                    'Reset all tasks, habits and stats to the starter data? This cannot be undone.',
                  )
                ) {
                  actions.reset()
                  onClose()
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Reset everything
            </Button>
          </div>
        </section>

        <p className="mt-auto pt-4 text-center text-xs text-slate-400">
          Momentum stores everything locally in your browser.
        </p>
      </motion.aside>
    </motion.div>
  )
}
