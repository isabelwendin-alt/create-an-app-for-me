import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from 'date-fns'
import type { Recurrence } from './types'

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export function parseDate(iso?: string | null): Date | null {
  if (!iso) return null
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

export function formatDate(iso?: string | null): string {
  const d = parseDate(iso)
  return d ? format(d, 'EEE, MMM d, yyyy') : '—'
}

export function formatDateShort(iso?: string | null): string {
  const d = parseDate(iso)
  return d ? format(d, 'MMM d') : '—'
}

/** Days from today until the given date. Negative = overdue. */
export function daysUntil(iso?: string | null): number | null {
  const d = parseDate(iso)
  if (!d) return null
  return differenceInCalendarDays(d, new Date())
}

export function relativeDue(iso?: string | null): string {
  const n = daysUntil(iso)
  if (n === null) return 'No date'
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n === -1) return '1 day overdue'
  if (n < 0) return `${Math.abs(n)} days overdue`
  if (n <= 30) return `in ${n} days`
  const d = parseDate(iso)!
  return `on ${format(d, 'MMM d')}`
}

export function formatMoney(
  amount?: number | null,
  currency = 'USD',
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/** Multiplier to convert a recurring amount into a monthly figure. */
export function monthlyMultiplier(r: Recurrence): number {
  switch (r) {
    case 'weekly':
      return 52 / 12
    case 'monthly':
      return 1
    case 'quarterly':
      return 1 / 3
    case 'yearly':
      return 1 / 12
    default:
      return 0
  }
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  JPY: '¥',
}
