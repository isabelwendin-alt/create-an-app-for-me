import type { Item } from './types'
import { CATEGORIES } from './categories'
import { formatDate, formatMoney } from './format'

export type DraftKind =
  | 'cancel'
  | 'dispute'
  | 'renewal-question'
  | 'confirm-appointment'
  | 'inquiry'

export interface DraftOption {
  kind: DraftKind
  label: string
}

export interface Draft {
  subject: string
  email: string
  call: string
}

/** Suggest the most relevant draft kinds for an item, best first. */
export function suggestedDrafts(item: Item): DraftOption[] {
  const opts: DraftOption[] = []
  const add = (kind: DraftKind, label: string) => opts.push({ kind, label })

  switch (item.action) {
    case 'cancel':
      add('cancel', 'Cancellation request')
      break
    case 'dispute':
      add('dispute', 'Dispute a charge')
      break
    case 'renew':
      add('renewal-question', 'Question the renewal')
      break
    default:
      break
  }
  if (item.category === 'subscription') add('cancel', 'Cancellation request')
  if (item.category === 'insurance') add('renewal-question', 'Question the renewal')
  if (item.category === 'appointment') add('confirm-appointment', 'Confirm / reschedule')
  add('dispute', 'Dispute a charge')
  add('inquiry', 'General inquiry')

  // de-dupe by kind, keep order
  const seen = new Set<DraftKind>()
  return opts.filter((o) => (seen.has(o.kind) ? false : (seen.add(o.kind), true)))
}

const acct = (item: Item) =>
  item.accountNumber ? ` (account/policy #${item.accountNumber})` : ''
const acctLine = (item: Item) =>
  item.accountNumber ? `Account / policy number: ${item.accountNumber}\n` : ''

export function buildDraft(item: Item, kind: DraftKind): Draft {
  const who = item.provider || CATEGORIES[item.category].label
  const money = item.amount ? formatMoney(item.amount, item.currency) : ''

  switch (kind) {
    case 'cancel':
      return {
        subject: `Cancellation request — ${who}${acct(item)}`,
        email: `Hello ${who} Support,

I'd like to cancel my ${item.title}${acct(item)}, effective at the end of my current billing period. Please stop any auto-renewal or recurring charges going forward.

${acctLine(item)}Please confirm in writing:
  • the exact cancellation/effective date,
  • that no further charges will be made, and
  • a cancellation confirmation number for my records.

If there is any early-termination fee or outstanding balance, let me know the amount before you process anything.

Thank you,
[Your name]`,
        call: `When you reach ${who}:

1. "Hi, I'd like to cancel my ${item.title}${acct(item)}."
2. If offered a retention discount, decide in advance whether you'll take it — otherwise: "I understand, but I'd still like to cancel."
3. Confirm: "What's the effective cancellation date, and will there be any final charge?"
4. Ask: "Can I get a cancellation confirmation number?" → write it here: ____________
5. Ask them to email written confirmation.`,
      }

    case 'dispute':
      return {
        subject: `Disputed charge — ${who}${money ? ` for ${money}` : ''}`,
        email: `Hello ${who},

I'm writing to dispute a charge on my account${money ? ` for ${money}` : ''}${
          item.dueDate ? ` dated ${formatDate(item.dueDate)}` : ''
        }.

${acctLine(item)}I don't believe this charge is correct because: [explain briefly — e.g. I was billed after cancelling / the amount differs from what I agreed to / I don't recognize this charge].

Please investigate and issue a correction or refund. Kindly confirm the outcome in writing and let me know if you need any additional information from me.

Thank you,
[Your name]`,
        call: `Dispute call script — ${who}:

1. "I'm calling to dispute a charge${money ? ` of ${money}` : ''}${
          item.dueDate ? ` from ${formatDate(item.dueDate)}` : ''
        }."
2. Give your ${item.accountNumber ? `account #${item.accountNumber}` : 'account details'}.
3. State clearly why it's wrong (one sentence).
4. Ask: "Can you reverse this or open a dispute case?" → case #: ____________
5. Note the rep's name and the date, and ask for email confirmation.`,
      }

    case 'renewal-question':
      return {
        subject: `Renewal question — ${item.title}${acct(item)}`,
        email: `Hello ${who},

My ${item.title}${acct(item)} is coming up for renewal${
          item.dueDate ? ` on ${formatDate(item.dueDate)}` : ''
        }${money ? `, and I see the amount listed as ${money}` : ''}.

${acctLine(item)}Before it renews, could you please help me understand:
  • Has my premium/price changed versus last term, and if so, why?
  • Are there any discounts I currently qualify for but am not receiving?
  • Would adjusting my coverage/plan meaningfully change the price?

I want to make sure I'm on the best option before the renewal date. Thank you for your help.

Best regards,
[Your name]`,
        call: `Renewal call script — ${who}:

1. "I'm calling about my upcoming renewal${
          item.dueDate ? ` on ${formatDate(item.dueDate)}` : ''
        }${item.accountNumber ? `, account #${item.accountNumber}` : ''}."
2. "Did my price change from last term? If so, by how much and why?"
3. "What discounts am I eligible for that aren't applied?"
4. "Would changing my coverage/plan lower the cost?"
5. Note the quoted price: ____________ and any reference #: ____________`,
      }

    case 'confirm-appointment':
      return {
        subject: `Appointment — ${item.title}`,
        email: `Hello ${who},

I'd like to confirm my appointment${
          item.dueDate ? ` scheduled for ${formatDate(item.dueDate)}` : ''
        }.

${acctLine(item)}Please confirm the date, time, and location, and let me know if there's anything I need to bring or complete beforehand. If I need to reschedule, what's the best way to do that?

Thank you,
[Your name]`,
        call: `Appointment call script — ${who}:

1. "I'd like to confirm my appointment${
          item.dueDate ? ` on ${formatDate(item.dueDate)}` : ''
        }."
2. Confirm date, time, and location.
3. Ask what to bring / prepare.
4. If needed: "I need to reschedule — what do you have available?"`,
      }

    default:
      return {
        subject: `Question about my account — ${who}${acct(item)}`,
        email: `Hello ${who},

I have a question regarding my ${item.title}${acct(item)}.

${acctLine(item)}[Write your question here.]

Could you please look into this and get back to me? Thank you for your help.

Best regards,
[Your name]`,
        call: `Inquiry call script — ${who}:

1. Give your ${item.accountNumber ? `account #${item.accountNumber}` : 'account details'}.
2. State your question clearly.
3. Note the answer and the rep's name: ____________
4. Ask for written/email confirmation if it matters.`,
      }
  }
}
