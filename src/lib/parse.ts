import { format, isValid, parse as parseFn } from 'date-fns'
import type { ActionType, Category, ParseResult, Recurrence } from './types'
import { CATEGORIES } from './categories'

/** Known brands → canonical name + best-guess category. */
const BRANDS: Array<{ match: RegExp; name: string; category: Category }> = [
  // insurance
  { match: /geico/i, name: 'Geico', category: 'insurance' },
  { match: /state\s?farm/i, name: 'State Farm', category: 'insurance' },
  { match: /progressive/i, name: 'Progressive', category: 'insurance' },
  { match: /allstate/i, name: 'Allstate', category: 'insurance' },
  { match: /liberty\s?mutual/i, name: 'Liberty Mutual', category: 'insurance' },
  { match: /nationwide/i, name: 'Nationwide', category: 'insurance' },
  { match: /\baaa\b/i, name: 'AAA', category: 'insurance' },
  { match: /metlife/i, name: 'MetLife', category: 'insurance' },
  { match: /cigna/i, name: 'Cigna', category: 'medical' },
  { match: /aetna/i, name: 'Aetna', category: 'medical' },
  { match: /blue\s?cross|blue\s?shield|anthem/i, name: 'Blue Cross Blue Shield', category: 'medical' },
  { match: /kaiser/i, name: 'Kaiser Permanente', category: 'medical' },
  { match: /united\s?healthcare/i, name: 'UnitedHealthcare', category: 'medical' },
  // utilities / telecom
  { match: /pg\s?&?\s?e|pacific gas/i, name: 'PG&E', category: 'utility' },
  { match: /con\s?ed|coned/i, name: 'Con Edison', category: 'utility' },
  { match: /duke energy/i, name: 'Duke Energy', category: 'utility' },
  { match: /comcast|xfinity/i, name: 'Xfinity', category: 'utility' },
  { match: /spectrum/i, name: 'Spectrum', category: 'utility' },
  { match: /at\s?&?\s?t/i, name: 'AT&T', category: 'utility' },
  { match: /verizon/i, name: 'Verizon', category: 'utility' },
  { match: /t-?mobile/i, name: 'T-Mobile', category: 'utility' },
  { match: /google\s?fiber/i, name: 'Google Fiber', category: 'utility' },
  // subscriptions / streaming / software
  { match: /netflix/i, name: 'Netflix', category: 'subscription' },
  { match: /spotify/i, name: 'Spotify', category: 'subscription' },
  { match: /apple\s?music/i, name: 'Apple Music', category: 'subscription' },
  { match: /youtube\s?(premium|music)/i, name: 'YouTube Premium', category: 'subscription' },
  { match: /disney\s?\+?/i, name: 'Disney+', category: 'subscription' },
  { match: /\bhulu\b/i, name: 'Hulu', category: 'subscription' },
  { match: /\bhbo\b|\bmax\b/i, name: 'Max', category: 'subscription' },
  { match: /amazon\s?prime|prime\s?video/i, name: 'Amazon Prime', category: 'subscription' },
  { match: /adobe|creative cloud/i, name: 'Adobe Creative Cloud', category: 'subscription' },
  { match: /dropbox/i, name: 'Dropbox', category: 'subscription' },
  { match: /notion/i, name: 'Notion', category: 'subscription' },
  { match: /icloud/i, name: 'iCloud+', category: 'subscription' },
  { match: /google\s?one/i, name: 'Google One', category: 'subscription' },
  { match: /microsoft\s?365|office\s?365/i, name: 'Microsoft 365', category: 'subscription' },
  { match: /audible/i, name: 'Audible', category: 'subscription' },
  { match: /peloton/i, name: 'Peloton', category: 'subscription' },
  { match: /planet fitness|\bla fitness\b|equinox|\bgym\b/i, name: 'Gym membership', category: 'subscription' },
  { match: /new york times|\bnyt\b/i, name: 'The New York Times', category: 'subscription' },
  { match: /tidal/i, name: 'Tidal', category: 'subscription' },
  { match: /paramount\s?\+?/i, name: 'Paramount+', category: 'subscription' },
  { match: /peacock/i, name: 'Peacock', category: 'subscription' },
  // tax / gov
  { match: /\birs\b|internal revenue/i, name: 'IRS', category: 'tax' },
  { match: /franchise tax board|\bftb\b/i, name: 'Franchise Tax Board', category: 'tax' },
  { match: /dmv/i, name: 'DMV', category: 'other' },
]

const MONTHS =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'

interface FoundDate {
  iso: string
  index: number
}

function tryFormats(raw: string, formats: string[]): Date | null {
  for (const f of formats) {
    const d = parseFn(raw, f, new Date())
    if (isValid(d)) return d
  }
  return null
}

function collectDates(text: string): FoundDate[] {
  const found: FoundDate[] = []
  const push = (d: Date | null, index: number) => {
    if (d && isValid(d)) found.push({ iso: format(d, 'yyyy-MM-dd'), index })
  }

  // ISO: 2025-03-14
  for (const m of text.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    push(tryFormats(m[0], ['yyyy-MM-dd', 'yyyy-M-d']), m.index ?? 0)
  }
  // US slash: 3/14/2025 or 03-14-25
  for (const m of text.matchAll(/\b(\d{1,2})[/](\d{1,2})[/](\d{2,4})\b/g)) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3]
    push(tryFormats(`${m[1]}/${m[2]}/${yr}`, ['M/d/yyyy']), m.index ?? 0)
  }
  // Month name first: March 14, 2025 / Mar 14 2025
  const re1 = new RegExp(
    `\\b(${MONTHS})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`,
    'gi',
  )
  for (const m of text.matchAll(re1)) {
    const cleaned = `${m[1]} ${m[2]} ${m[3]}`.replace(/\./g, '')
    push(tryFormats(cleaned, ['MMM d yyyy', 'MMMM d yyyy']), m.index ?? 0)
  }
  // Day month year: 14 March 2025
  const re2 = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS})\\.?,?\\s+(\\d{4})\\b`,
    'gi',
  )
  for (const m of text.matchAll(re2)) {
    const cleaned = `${m[1]} ${m[2]} ${m[3]}`.replace(/\./g, '')
    push(tryFormats(cleaned, ['d MMM yyyy', 'd MMMM yyyy']), m.index ?? 0)
  }
  return found
}

const DUE_KEYWORDS =
  /(due|payment due|pay by|renew|renewal|renews|expires?|expiration|valid (?:through|until)|auto[- ]?renew|bill date|appointment|scheduled)/i

function pickDate(text: string, dates: FoundDate[]): string | null {
  if (dates.length === 0) return null
  // Prefer a date that appears close after a due-type keyword.
  let best: { iso: string; score: number } | null = null
  for (const d of dates) {
    const before = text.slice(Math.max(0, d.index - 40), d.index)
    let score = 0
    if (DUE_KEYWORDS.test(before)) score += 100
    // future dates are more likely to be the relevant due date
    const ms = new Date(d.iso).getTime() - Date.now()
    if (ms > 0) score += 20
    // earlier future dates slightly preferred
    score -= Math.abs(ms) / (1000 * 60 * 60 * 24 * 400)
    if (!best || score > best.score) best = { iso: d.iso, score }
  }
  return best?.iso ?? dates[0].iso
}

function pickAmount(text: string): number | null {
  const candidates: Array<{ value: number; score: number }> = []
  const re = /(?:\$|usd\s?)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi
  for (const m of text.matchAll(re)) {
    const value = parseFloat(m[1].replace(/,/g, ''))
    if (Number.isNaN(value)) continue
    const before = text.slice(Math.max(0, (m.index ?? 0) - 40), m.index)
    let score = 10 // has a currency symbol
    if (/(amount due|total due|balance|pay(?:ment)?|premium|amount|total)/i.test(before))
      score += 50
    if (/(minimum|min\.?\s*payment|late fee|autopay)/i.test(before)) score -= 15
    score += Math.min(value, 10000) / 10000 // prefer larger, capped
    candidates.push({ value, score })
  }
  // Fallback: labeled amounts without a currency symbol ("Amount due: 712.40")
  const labeled =
    /(amount due|total due|balance due|balance|premium|amount|total|payment due|monthly (?:premium|payment))\s*[:\-]?\s*\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+\.\d{2})/gi
  for (const m of text.matchAll(labeled)) {
    const value = parseFloat(m[2].replace(/,/g, ''))
    if (Number.isNaN(value)) continue
    candidates.push({ value, score: 45 + Math.min(value, 10000) / 10000 })
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].value
}

function pickAccount(text: string): string | undefined {
  const re =
    /\b(account|acct|policy|member(?:ship)?|customer|reference|ref|invoice|confirmation|order|apn)\b\s*(?:#|no\.?|number|id)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,})/gi
  for (const m of text.matchAll(re)) {
    const val = m[2].toUpperCase()
    // account/policy numbers contain at least one digit — avoids catching words
    if (!/\d/.test(val)) continue
    // avoid pure years / obvious dates
    if (/^\d{4}$/.test(val) && Number(val) > 1900 && Number(val) < 2100) continue
    return val
  }
  return undefined
}

function detectRecurrence(text: string): Recurrence | undefined {
  if (/\b(annually|per year|\/year|\/yr|yearly|12[- ]month)\b/i.test(text)) return 'yearly'
  if (/\b(quarterly|per quarter|every 3 months)\b/i.test(text)) return 'quarterly'
  if (/\b(weekly|per week|\/week|\/wk)\b/i.test(text)) return 'weekly'
  if (/\b(monthly|per month|\/month|\/mo|a month)\b/i.test(text)) return 'monthly'
  return undefined
}

function detectAction(text: string): { action: ActionType; note?: string } {
  if (/\b(past due|overdue|final notice|delinquent)\b/i.test(text))
    return { action: 'pay', note: 'Past due — pay to avoid late fees.' }
  if (/\b(action required|please renew|renew your|renewal notice|auto[- ]?renew)\b/i.test(text))
    return { action: 'renew', note: 'Confirm the renewal terms before it auto-renews.' }
  if (/\b(cancel|cancellation)\b/i.test(text)) return { action: 'cancel' }
  if (/\b(dispute|incorrect charge|unauthorized)\b/i.test(text)) return { action: 'dispute' }
  if (/\b(sign|signature required|e-?sign|docusign)\b/i.test(text)) return { action: 'sign' }
  if (/\b(call us|please call|contact us|reschedule)\b/i.test(text)) return { action: 'call' }
  return { action: 'none' }
}

const CATEGORY_KEYWORDS: Array<{ cat: Category; words: RegExp }> = [
  { cat: 'insurance', words: /premium|policy|coverage|deductible|insured|insurer|liability|comprehensive/i },
  { cat: 'utility', words: /kwh|electric|electricity|water bill|sewer|natural gas|therms?|energy|internet|broadband|wireless|data plan|utility/i },
  { cat: 'medical', words: /copay|co-?pay|patient|prescription|pharmacy|clinic|hospital|dental|deductible met|member id|explanation of benefits|eob/i },
  { cat: 'tax', words: /\btax\b|\birs\b|withholding|1099|w-?2|property tax|estimated tax|refund/i },
  { cat: 'warranty', words: /warranty|protection plan|coverage expires|extended service/i },
  { cat: 'appointment', words: /appointment|scheduled for|your visit|reservation|booking confirmed/i },
  { cat: 'loan', words: /loan|mortgage|principal|interest rate|lender|apr|amortization/i },
  { cat: 'housing', words: /\brent\b|lease|landlord|property management|hoa|tenant/i },
  { cat: 'subscription', words: /subscription|your plan|membership|renews|free trial|billing cycle|streaming/i },
]

function detectCategory(text: string): Category | undefined {
  const scores: Partial<Record<Category, number>> = {}
  for (const { cat, words } of CATEGORY_KEYWORDS) {
    const matches = text.match(new RegExp(words, 'gi'))
    if (matches) scores[cat] = (scores[cat] ?? 0) + matches.length
  }
  let best: Category | undefined
  let bestScore = 0
  for (const [cat, score] of Object.entries(scores) as [Category, number][]) {
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }
  return best
}

function detectProvider(
  text: string,
): { name: string; category?: Category } | undefined {
  for (const b of BRANDS) {
    if (b.match.test(text)) return { name: b.name, category: b.category }
  }
  // "From: Company Name <...>" style
  const from = text.match(/^\s*from:\s*([^<\n]+?)(?:<|\n|$)/im)
  if (from) {
    const name = from[1].trim().replace(/["']/g, '')
    if (name && name.length <= 40) return { name }
  }
  return undefined
}

export function parseIntake(raw: string): ParseResult {
  const text = raw.trim()
  const detected: string[] = []
  if (!text) return { fields: {}, detected }

  const providerHit = detectProvider(text)
  const amount = pickAmount(text)
  const dates = collectDates(text)
  const dueDate = pickDate(text, dates)
  const accountNumber = pickAccount(text)
  const recurrence = detectRecurrence(text)
  const autoPay = /auto[- ]?pay|automatic payment|autopay|charged automatically/i.test(text)
  const { action, note } = detectAction(text)

  const category =
    detectCategory(text) ?? providerHit?.category ?? undefined

  const provider = providerHit?.name
  const noun = category ? CATEGORIES[category].noun : 'item'
  const title = provider
    ? `${provider} ${noun}`.replace(/\s+/g, ' ').trim()
    : category
      ? CATEGORIES[category].label
      : ''

  if (provider) detected.push(`Provider: ${provider}`)
  if (category) detected.push(`Category: ${CATEGORIES[category].label}`)
  if (amount !== null) detected.push(`Amount: $${amount.toFixed(2)}`)
  if (dueDate) detected.push(`Date: ${format(new Date(dueDate), 'MMM d, yyyy')}`)
  if (accountNumber) detected.push(`Account: ${accountNumber}`)
  if (recurrence) detected.push(`Recurs: ${recurrence}`)
  if (autoPay) detected.push('Auto-pay: on')
  if (action !== 'none') detected.push(`Action: ${action}`)

  return {
    fields: {
      title: title || undefined,
      category,
      provider,
      amount,
      dueDate,
      recurrence,
      accountNumber,
      autoPay,
      action,
      actionNote: note,
    },
    detected,
  }
}
