export type Category =
  | 'insurance'
  | 'utility'
  | 'subscription'
  | 'medical'
  | 'tax'
  | 'warranty'
  | 'appointment'
  | 'loan'
  | 'housing'
  | 'other'

export type Recurrence = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type ItemStatus = 'active' | 'resolved' | 'archived'

export type ActionType =
  | 'pay'
  | 'renew'
  | 'cancel'
  | 'dispute'
  | 'call'
  | 'sign'
  | 'review'
  | 'none'

export type Usage = 'often' | 'sometimes' | 'rarely' | 'unknown'

export interface PricePoint {
  /** ISO yyyy-mm-dd */
  date: string
  amount: number
}

export interface Item {
  id: string
  title: string
  category: Category
  provider?: string
  amount?: number | null
  currency: string
  /** ISO yyyy-mm-dd for the next due / renewal / expiration date */
  dueDate?: string | null
  recurrence: Recurrence
  accountNumber?: string
  paymentMethod?: string
  autoPay: boolean
  action: ActionType
  actionNote?: string
  status: ItemStatus
  notes?: string
  /** only meaningful for subscriptions */
  usage?: Usage
  priceHistory: PricePoint[]
  createdAt: number
  updatedAt: number
  resolvedAt?: number | null
}

export interface Settings {
  theme: 'light' | 'dark'
  currency: string
}

export interface AppState {
  items: Item[]
  settings: Settings
}

/** Partial item produced by the intake parser. */
export interface ParsedFields {
  title?: string
  category?: Category
  provider?: string
  amount?: number | null
  dueDate?: string | null
  recurrence?: Recurrence
  accountNumber?: string
  paymentMethod?: string
  autoPay?: boolean
  action?: ActionType
  actionNote?: string
}

export interface ParseResult {
  fields: ParsedFields
  /** human-readable chips describing what was detected */
  detected: string[]
}
