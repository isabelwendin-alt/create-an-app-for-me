import { useRef } from 'react'
import { Download, Moon, RefreshCw, Sun, Trash2, Upload } from 'lucide-react'
import type { AppState } from '../lib/types'
import { CURRENCIES } from '../lib/format'
import { useStore } from '../store'
import { Button, Field, Modal, Select, Toggle } from './ui'

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state, setSettings, loadSamples, clearAll, importState } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifeline-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState
        if (parsed && Array.isArray(parsed.items)) {
          importState({
            items: parsed.items,
            settings: { ...state.settings, ...parsed.settings },
          })
        }
      } catch {
        /* ignore invalid file */
      }
    }
    reader.readAsText(file)
  }

  const isDark = state.settings.theme === 'dark'

  return (
    <Modal open={open} onClose={onClose} title="Settings" subtitle="Preferences & your data">
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-4 w-4 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Dark mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDark ? 'Currently on' : 'Currently off'}
              </p>
            </div>
          </div>
          <Toggle
            checked={isDark}
            onChange={(v) => setSettings({ theme: v ? 'dark' : 'light' })}
          />
        </div>

        <Field label="Default currency">
          <Select
            value={state.settings.currency}
            onChange={(e) => setSettings({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your data
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Everything lives in this browser — nothing is sent anywhere. Back it up
            or move it to another device.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" onClick={exportData}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="soft" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importData(f)
                e.target.value = ''
              }}
            />
            <Button variant="soft" onClick={loadSamples}>
              <RefreshCw className="h-4 w-4" /> Load samples
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Delete all tracked items? This cannot be undone.',
                  )
                )
                  clearAll()
              }}
            >
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
