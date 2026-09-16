import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  AppState,
  FocusSession,
  Habit,
  Priority,
  Settings,
  Task,
} from './lib/types'
import { dayKey, uid } from './lib/utils'

const STORAGE_KEY = 'momentum.v1'

const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: false,
  soundOn: true,
  theme: 'dark',
}

function seed(): AppState {
  const now = Date.now()
  return {
    tasks: [
      {
        id: uid(),
        title: 'Plan the day and pick a focus',
        done: false,
        priority: 'high',
        estPomodoros: 1,
        donePomodoros: 0,
        createdAt: now,
      },
      {
        id: uid(),
        title: 'Deep work session on the main project',
        done: false,
        priority: 'medium',
        estPomodoros: 3,
        donePomodoros: 0,
        createdAt: now + 1,
      },
      {
        id: uid(),
        title: 'Inbox zero & quick replies',
        done: false,
        priority: 'low',
        estPomodoros: 1,
        donePomodoros: 0,
        createdAt: now + 2,
      },
    ],
    habits: [
      {
        id: uid(),
        name: 'Drink water',
        emoji: '💧',
        color: '#06b6d4',
        targetPerWeek: 7,
        createdAt: now,
        history: {},
      },
      {
        id: uid(),
        name: 'Move 30 min',
        emoji: '🏃',
        color: '#10b981',
        targetPerWeek: 5,
        createdAt: now,
        history: {},
      },
      {
        id: uid(),
        name: 'Read',
        emoji: '📚',
        color: '#f59e0b',
        targetPerWeek: 5,
        createdAt: now,
        history: {},
      },
    ],
    sessions: [],
    settings: defaultSettings,
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      tasks: parsed.tasks ?? [],
      habits: parsed.habits ?? [],
      sessions: parsed.sessions ?? [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return seed()
  }
}

type Action =
  | { type: 'ADD_TASK'; title: string; priority: Priority; est: number }
  | { type: 'UPDATE_TASK'; id: string; patch: Partial<Task> }
  | { type: 'TOGGLE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'CLEAR_COMPLETED' }
  | { type: 'REORDER_TASKS'; ids: string[] }
  | { type: 'INCREMENT_TASK_POMODORO'; id: string }
  | { type: 'ADD_HABIT'; habit: Omit<Habit, 'id' | 'createdAt' | 'history'> }
  | { type: 'UPDATE_HABIT'; id: string; patch: Partial<Habit> }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'TOGGLE_HABIT'; id: string; day: string }
  | { type: 'ADD_SESSION'; session: FocusSession }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'IMPORT'; state: AppState }
  | { type: 'RESET' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          {
            id: uid(),
            title: action.title,
            done: false,
            priority: action.priority,
            estPomodoros: action.est,
            donePomodoros: 0,
            createdAt: Date.now(),
          },
          ...state.tasks,
        ],
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
      }
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                done: !t.done,
                completedAt: !t.done ? Date.now() : undefined,
              }
            : t,
        ),
      }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'CLEAR_COMPLETED':
      return { ...state, tasks: state.tasks.filter((t) => !t.done) }
    case 'REORDER_TASKS': {
      const map = new Map(state.tasks.map((t) => [t.id, t]))
      const next = action.ids
        .map((id) => map.get(id))
        .filter((t): t is Task => Boolean(t))
      return { ...state, tasks: next }
    }
    case 'INCREMENT_TASK_POMODORO':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, donePomodoros: t.donePomodoros + 1 }
            : t,
        ),
      }
    case 'ADD_HABIT':
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            id: uid(),
            createdAt: Date.now(),
            history: {},
            ...action.habit,
          },
        ],
      }
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.id ? { ...h, ...action.patch } : h,
        ),
      }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id) }
    case 'TOGGLE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h
          const history = { ...h.history }
          if (history[action.day]) delete history[action.day]
          else history[action.day] = true
          return { ...h, history }
        }),
      }
    case 'ADD_SESSION':
      return { ...state, sessions: [action.session, ...state.sessions] }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'IMPORT':
      return action.state
    case 'RESET':
      return seed()
    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  actions: {
    addTask: (title: string, priority: Priority, est: number) => void
    updateTask: (id: string, patch: Partial<Task>) => void
    toggleTask: (id: string) => void
    deleteTask: (id: string) => void
    clearCompleted: () => void
    reorderTasks: (ids: string[]) => void
    incTaskPomodoro: (id: string) => void
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'history'>) => void
    updateHabit: (id: string, patch: Partial<Habit>) => void
    deleteHabit: (id: string) => void
    toggleHabit: (id: string, day?: string) => void
    addSession: (session: FocusSession) => void
    updateSettings: (patch: Partial<Settings>) => void
    reset: () => void
    importState: (state: AppState) => void
  }
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

  // Keep the <html> element in sync with the theme setting.
  useEffect(() => {
    const root = document.documentElement
    if (state.settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [state.settings.theme])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      actions: {
        addTask: (title, priority, est) =>
          dispatch({ type: 'ADD_TASK', title, priority, est }),
        updateTask: (id, patch) => dispatch({ type: 'UPDATE_TASK', id, patch }),
        toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', id }),
        deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
        clearCompleted: () => dispatch({ type: 'CLEAR_COMPLETED' }),
        reorderTasks: (ids) => dispatch({ type: 'REORDER_TASKS', ids }),
        incTaskPomodoro: (id) =>
          dispatch({ type: 'INCREMENT_TASK_POMODORO', id }),
        addHabit: (habit) => dispatch({ type: 'ADD_HABIT', habit }),
        updateHabit: (id, patch) => dispatch({ type: 'UPDATE_HABIT', id, patch }),
        deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
        toggleHabit: (id, day) =>
          dispatch({ type: 'TOGGLE_HABIT', id, day: day ?? dayKey() }),
        addSession: (session) => dispatch({ type: 'ADD_SESSION', session }),
        updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
        reset: () => dispatch({ type: 'RESET' }),
        importState: (s) => dispatch({ type: 'IMPORT', state: s }),
      },
    }),
    [state],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
