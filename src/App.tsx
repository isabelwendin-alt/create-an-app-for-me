import { useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Settings as SettingsIcon,
} from 'lucide-react'
import type { Item } from './lib/types'
import { useStore } from './store'
import { Button, cn } from './components/ui'
import { Dashboard } from './components/Dashboard'
import { Tracker } from './components/Tracker'
import { Insights } from './components/Insights'
import { Recap } from './components/Recap'
import { AddItemModal, EditItemModal } from './components/ItemFormModal'
import { ItemDetailModal } from './components/ItemDetail'
import { DraftModal } from './components/DraftModal'
import { SettingsModal } from './components/Settings'

type Tab = 'overview' | 'tracker' | 'insights' | 'recap'

const NAV: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tracker', label: 'Tracker', icon: ClipboardList },
  { key: 'insights', label: 'Insights', icon: Lightbulb },
  { key: 'recap', label: 'Recap', icon: BarChart3 },
]

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)

  const byId = useMemo(() => {
    const m = new Map<string, Item>()
    for (const i of state.items) m.set(i.id, i)
    return m
  }, [state.items])

  const detailItem = detailId ? byId.get(detailId) ?? null : null
  const editItem = editId ? byId.get(editId) ?? null : null
  const draftItem = draftId ? byId.get(draftId) ?? null : null

  const openItem = (item: Item) => setDetailId(item.id)
  const draftItemAction = (item: Item) => {
    setDetailId(null)
    setDraftId(item.id)
  }
  const editItemAction = (item: Item) => {
    setDetailId(null)
    setEditId(item.id)
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-slate-50 to-brand-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/40 dark:text-slate-100">
      <div className="mx-auto flex min-h-full max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/70 px-4 py-6 dark:border-white/5 md:flex">
          <Logo />
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((n) => (
              <NavButton
                key={n.key}
                active={tab === n.key}
                icon={<n.icon className="h-5 w-5" />}
                label={n.label}
                onClick={() => setTab(n.key)}
              />
            ))}
          </nav>
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add item
            </Button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
            >
              <SettingsIcon className="h-4 w-4" /> Settings
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70 md:hidden">
            <Logo compact />
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/5"
              aria-label="Settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10 md:pt-8">
            <div className="animate-fade-in">
              {tab === 'overview' && (
                <Dashboard
                  onOpen={openItem}
                  onDraft={draftItemAction}
                  onAdd={() => setAddOpen(true)}
                  onGoTracker={() => setTab('tracker')}
                />
              )}
              {tab === 'tracker' && (
                <Tracker onOpen={openItem} onAdd={() => setAddOpen(true)} />
              )}
              {tab === 'insights' && (
                <Insights onOpen={openItem} onDraft={draftItemAction} />
              )}
              {tab === 'recap' && <Recap onOpen={openItem} />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/80 md:hidden">
        <div className="flex items-center justify-around">
          {NAV.slice(0, 2).map((n) => (
            <MobileNav
              key={n.key}
              active={tab === n.key}
              icon={<n.icon className="h-5 w-5" />}
              label={n.label}
              onClick={() => setTab(n.key)}
            />
          ))}
          <button
            onClick={() => setAddOpen(true)}
            className="relative -mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/40 transition active:scale-95"
            aria-label="Add item"
          >
            <Plus className="h-6 w-6" />
          </button>
          {NAV.slice(2).map((n) => (
            <MobileNav
              key={n.key}
              active={tab === n.key}
              icon={<n.icon className="h-5 w-5" />}
              label={n.label}
              onClick={() => setTab(n.key)}
            />
          ))}
        </div>
      </nav>

      {/* Modals */}
      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          open={!!detailItem}
          onClose={() => setDetailId(null)}
          onEdit={editItemAction}
          onDraft={draftItemAction}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          open={!!editItem}
          onClose={() => setEditId(null)}
        />
      )}
      {draftItem && (
        <DraftModal
          item={draftItem}
          open={!!draftItem}
          onClose={() => setDraftId(null)}
        />
      )}
    </div>
  )
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
        <Activity className="h-5 w-5" />
      </div>
      <div className={cn(compact && 'sm:block')}>
        <p className="text-lg font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
          Lifeline
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Your admin, handled
          </p>
        )}
      </div>
    </div>
  )
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
        active
          ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
          : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function MobileNav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition',
        active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
