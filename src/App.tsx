import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { Brain, ListTodo, Repeat, BarChart3, Settings, Sun, Moon, Zap } from 'lucide-react'
import { StoreProvider, useStore } from './store'
import FocusTimer from './components/FocusTimer'
import Tasks from './components/Tasks'
import Habits from './components/Habits'
import Stats from './components/Stats'
import SettingsPanel from './components/Settings'
import { cn } from './components/ui'

type Tab = 'focus' | 'tasks' | 'habits' | 'stats'

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: 'focus', label: 'Focus', icon: Brain },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'habits', label: 'Habits', icon: Repeat },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function Shell() {
  const { state, actions } = useStore()
  const [tab, setTab] = useState<Tab>('focus')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dark = state.settings.theme === 'dark'

  // Keyboard shortcuts: 1-4 switch tabs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      )
        return
      const map: Record<string, Tab> = {
        '1': 'focus',
        '2': 'tasks',
        '3': 'habits',
        '4': 'stats',
      }
      if (map[e.key]) setTab(map[e.key])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openTasks = state.tasks.filter((t) => !t.done).length

  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0b1020] dark:text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-600/20" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-pink-400/10 blur-3xl dark:bg-pink-500/10" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
              <Zap className="h-6 w-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none tracking-tight">
                Momentum
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {greeting()} · {format(new Date(), 'EEEE, MMM d')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                actions.updateSettings({ theme: dark ? 'light' : 'dark' })
              }
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/5"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/5"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop tab bar */}
        <nav className="mb-8 hidden justify-center sm:flex">
          <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
                  tab === t.id
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
                )}
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.id === 'tasks' && openTasks > 0 && (
                    <span className="relative z-10 grid h-5 min-w-5 place-items-center rounded-full bg-white/20 px-1 text-[11px] font-bold">
                      {openTasks}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {tab === 'focus' && (
                <div className="pt-4">
                  <FocusTimer />
                </div>
              )}
              {tab === 'tasks' && <Tasks />}
              {tab === 'habits' && <Habits />}
              {tab === 'stats' && <Stats />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                tab === t.id
                  ? 'text-brand-500'
                  : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="mobile-tab"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div className="relative">
                <t.icon className="h-5 w-5" />
                {t.id === 'tasks' && openTasks > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">
                    {openTasks}
                  </span>
                )}
              </div>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
