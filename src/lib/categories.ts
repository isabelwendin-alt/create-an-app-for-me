import {
  BadgeCheck,
  Banknote,
  CalendarClock,
  FileText,
  HeartPulse,
  Home,
  Landmark,
  Repeat,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from './types'

export interface CategoryMeta {
  key: Category
  label: string
  /** short noun used when composing item titles, e.g. "Netflix subscription" */
  noun: string
  icon: LucideIcon
  hex: string
  /** tailwind text color class */
  text: string
  /** tailwind soft background */
  soft: string
  /** tailwind dot / solid background */
  dot: string
  ring: string
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  insurance: {
    key: 'insurance',
    label: 'Insurance',
    noun: 'insurance',
    icon: ShieldCheck,
    hex: '#0ea5e9',
    text: 'text-sky-600 dark:text-sky-300',
    soft: 'bg-sky-500/10',
    dot: 'bg-sky-500',
    ring: 'ring-sky-500/30',
  },
  utility: {
    key: 'utility',
    label: 'Utilities',
    noun: 'utility bill',
    icon: Zap,
    hex: '#f59e0b',
    text: 'text-amber-600 dark:text-amber-300',
    soft: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/30',
  },
  subscription: {
    key: 'subscription',
    label: 'Subscriptions',
    noun: 'subscription',
    icon: Repeat,
    hex: '#8b5cf6',
    text: 'text-violet-600 dark:text-violet-300',
    soft: 'bg-violet-500/10',
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/30',
  },
  medical: {
    key: 'medical',
    label: 'Medical',
    noun: 'medical bill',
    icon: HeartPulse,
    hex: '#f43f5e',
    text: 'text-rose-600 dark:text-rose-300',
    soft: 'bg-rose-500/10',
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/30',
  },
  tax: {
    key: 'tax',
    label: 'Taxes',
    noun: 'tax',
    icon: Landmark,
    hex: '#ef4444',
    text: 'text-red-600 dark:text-red-300',
    soft: 'bg-red-500/10',
    dot: 'bg-red-500',
    ring: 'ring-red-500/30',
  },
  warranty: {
    key: 'warranty',
    label: 'Warranties',
    noun: 'warranty',
    icon: BadgeCheck,
    hex: '#10b981',
    text: 'text-emerald-600 dark:text-emerald-300',
    soft: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
  },
  appointment: {
    key: 'appointment',
    label: 'Appointments',
    noun: 'appointment',
    icon: CalendarClock,
    hex: '#06b6d4',
    text: 'text-cyan-600 dark:text-cyan-300',
    soft: 'bg-cyan-500/10',
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/30',
  },
  loan: {
    key: 'loan',
    label: 'Loans',
    noun: 'loan',
    icon: Banknote,
    hex: '#f97316',
    text: 'text-orange-600 dark:text-orange-300',
    soft: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/30',
  },
  housing: {
    key: 'housing',
    label: 'Housing',
    noun: 'housing',
    icon: Home,
    hex: '#6366f1',
    text: 'text-indigo-600 dark:text-indigo-300',
    soft: 'bg-indigo-500/10',
    dot: 'bg-indigo-500',
    ring: 'ring-indigo-500/30',
  },
  other: {
    key: 'other',
    label: 'Other',
    noun: 'item',
    icon: FileText,
    hex: '#64748b',
    text: 'text-slate-600 dark:text-slate-300',
    soft: 'bg-slate-500/10',
    dot: 'bg-slate-500',
    ring: 'ring-slate-500/30',
  },
}

export const CATEGORY_ORDER: Category[] = [
  'insurance',
  'utility',
  'subscription',
  'housing',
  'loan',
  'medical',
  'tax',
  'warranty',
  'appointment',
  'other',
]

export const RECURRENCE_LABEL: Record<string, string> = {
  none: 'One-time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

export const ACTION_LABEL: Record<string, string> = {
  pay: 'Pay',
  renew: 'Renew',
  cancel: 'Cancel',
  dispute: 'Dispute',
  call: 'Call',
  sign: 'Sign',
  review: 'Review',
  none: 'No action',
}
