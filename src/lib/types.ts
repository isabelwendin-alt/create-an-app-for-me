export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  notes?: string
  done: boolean
  priority: Priority
  estPomodoros: number
  donePomodoros: number
  createdAt: number
  completedAt?: number
}

export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  targetPerWeek: number
  createdAt: number
  /** map of yyyy-MM-dd -> completed */
  history: Record<string, boolean>
}

export type SessionType = 'focus' | 'short' | 'long'

export interface FocusSession {
  id: string
  type: SessionType
  /** minutes actually completed */
  minutes: number
  finishedAt: number
  taskId?: string
}

export interface Settings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundOn: boolean
  theme: 'dark' | 'light'
}

export interface AppState {
  tasks: Task[]
  habits: Habit[]
  sessions: FocusSession[]
  settings: Settings
}
