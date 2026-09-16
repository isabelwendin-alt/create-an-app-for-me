import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { AppState, Item, ParsedFields, Settings } from './lib/types'
import { uid } from './lib/utils'
import { sampleItems } from './lib/sampleData'
import { todayISO } from './lib/format'

const STORAGE_KEY = 'lifeline.v1'

const defaultSettings: Settings = {
  theme: 'dark',
  currency: 'USD',
}

function initialState(): AppState {
  return { items: sampleItems(), settings: defaultSettings }
}

export function newItemFromFields(
  fields: ParsedFields,
  currency: string,
): Item {
  const now = Date.now()
  const amount =
    fields.amount === undefined || fields.amount === null
      ? null
      : fields.amount
  return {
    id: uid(),
    title: fields.title?.trim() || 'Untitled item',
    category: fields.category ?? 'other',
    provider: fields.provider?.trim() || undefined,
    amount,
    currency,
    dueDate: fields.dueDate ?? null,
    recurrence: fields.recurrence ?? 'none',
    accountNumber: fields.accountNumber?.trim() || undefined,
    paymentMethod: fields.paymentMethod?.trim() || undefined,
    autoPay: fields.autoPay ?? false,
    action: fields.action ?? 'none',
    actionNote: fields.actionNote?.trim() || undefined,
    status: 'active',
    notes: undefined,
    usage: fields.category === 'subscription' ? 'unknown' : undefined,
    priceHistory:
      amount !== null ? [{ date: todayISO(), amount }] : [],
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  }
}

type Action =
  | { type: 'add'; item: Item }
  | { type: 'update'; id: string; patch: Partial<Item> }
  | { type: 'delete'; id: string }
  | { type: 'setStatus'; id: string; status: Item['status'] }
  | { type: 'snooze'; id: string; date: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'loadSamples' }
  | { type: 'clearAll' }
  | { type: 'import'; state: AppState }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add':
      return { ...state, items: [action.item, ...state.items] }
    case 'update':
      return {
        ...state,
        items: state.items.map((i) => {
          if (i.id !== action.id) return i
          const next: Item = { ...i, ...action.patch, updatedAt: Date.now() }
          // track price history when amount changes to a new value
          if (
            action.patch.amount !== undefined &&
            action.patch.amount !== null &&
            action.patch.amount !== i.amount
          ) {
            const last = i.priceHistory[i.priceHistory.length - 1]
            if (!last || last.amount !== action.patch.amount) {
              next.priceHistory = [
                ...i.priceHistory,
                { date: todayISO(), amount: action.patch.amount },
              ]
            }
          }
          return next
        }),
      }
    case 'delete':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'setStatus':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? {
                ...i,
                status: action.status,
                resolvedAt:
                  action.status === 'resolved' ? Date.now() : null,
                updatedAt: Date.now(),
              }
            : i,
        ),
      }
    case 'snooze':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, dueDate: action.date, updatedAt: Date.now() }
            : i,
        ),
      }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'loadSamples':
      return { ...state, items: sampleItems() }
    case 'clearAll':
      return { ...state, items: [] }
    case 'import':
      return action.state
    default:
      return state
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.items)) return initialState()
    return {
      items: parsed.items,
      settings: { ...defaultSettings, ...parsed.settings },
    }
  } catch {
    return initialState()
  }
}

interface StoreValue {
  state: AppState
  addItem: (item: Item) => void
  updateItem: (id: string, patch: Partial<Item>) => void
  deleteItem: (id: string) => void
  setStatus: (id: string, status: Item['status']) => void
  snooze: (id: string, date: string) => void
  setSettings: (patch: Partial<Settings>) => void
  loadSamples: () => void
  clearAll: () => void
  importState: (state: AppState) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    if (state.settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [state.settings.theme])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      addItem: (item) => dispatch({ type: 'add', item }),
      updateItem: (id, patch) => dispatch({ type: 'update', id, patch }),
      deleteItem: (id) => dispatch({ type: 'delete', id }),
      setStatus: (id, status) => dispatch({ type: 'setStatus', id, status }),
      snooze: (id, date) => dispatch({ type: 'snooze', id, date }),
      setSettings: (patch) => dispatch({ type: 'settings', patch }),
      loadSamples: () => dispatch({ type: 'loadSamples' }),
      clearAll: () => dispatch({ type: 'clearAll' }),
      importState: (s) => dispatch({ type: 'import', state: s }),
    }),
    [state],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
