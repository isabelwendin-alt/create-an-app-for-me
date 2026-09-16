import { useMemo, useState } from 'react'
import { ScanLine, Sparkles, Wand2 } from 'lucide-react'
import type { Category, Item, Recurrence, ActionType, Usage } from '../lib/types'
import { CATEGORIES, CATEGORY_ORDER, RECURRENCE_LABEL, ACTION_LABEL } from '../lib/categories'
import { parseIntake } from '../lib/parse'
import { CURRENCY_SYMBOL } from '../lib/format'
import { useStore, newItemFromFields } from '../store'
import { Button, Field, Input, Modal, Select, Textarea, Toggle, cn } from './ui'

interface FormDraft {
  title: string
  category: Category
  provider: string
  amount: string
  dueDate: string
  recurrence: Recurrence
  accountNumber: string
  paymentMethod: string
  autoPay: boolean
  action: ActionType
  actionNote: string
  usage: Usage
  notes: string
}

const emptyDraft = (): FormDraft => ({
  title: '',
  category: 'other',
  provider: '',
  amount: '',
  dueDate: '',
  recurrence: 'none',
  accountNumber: '',
  paymentMethod: '',
  autoPay: false,
  action: 'none',
  actionNote: '',
  usage: 'unknown',
  notes: '',
})

function itemToDraft(item: Item): FormDraft {
  return {
    title: item.title,
    category: item.category,
    provider: item.provider ?? '',
    amount: item.amount === null || item.amount === undefined ? '' : String(item.amount),
    dueDate: item.dueDate ?? '',
    recurrence: item.recurrence,
    accountNumber: item.accountNumber ?? '',
    paymentMethod: item.paymentMethod ?? '',
    autoPay: item.autoPay,
    action: item.action,
    actionNote: item.actionNote ?? '',
    usage: item.usage ?? 'unknown',
    notes: item.notes ?? '',
  }
}

function draftToPatch(d: FormDraft): Partial<Item> {
  const amt = d.amount.trim() === '' ? null : Number(d.amount)
  return {
    title: d.title.trim() || 'Untitled item',
    category: d.category,
    provider: d.provider.trim() || undefined,
    amount: amt !== null && Number.isNaN(amt) ? null : amt,
    dueDate: d.dueDate || null,
    recurrence: d.recurrence,
    accountNumber: d.accountNumber.trim() || undefined,
    paymentMethod: d.paymentMethod.trim() || undefined,
    autoPay: d.autoPay,
    action: d.action,
    actionNote: d.actionNote.trim() || undefined,
    usage: d.category === 'subscription' ? d.usage : undefined,
    notes: d.notes.trim() || undefined,
  }
}

function ItemFields({
  draft,
  set,
  currency,
}: {
  draft: FormDraft
  set: <K extends keyof FormDraft>(k: K, v: FormDraft[K]) => void
  currency: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="What is it?" className="sm:col-span-2">
        <Input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Geico auto insurance"
          autoFocus
        />
      </Field>

      <Field label="Category">
        <Select
          value={draft.category}
          onChange={(e) => set('category', e.target.value as Category)}
        >
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORIES[c].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Provider / company">
        <Input
          value={draft.provider}
          onChange={(e) => set('provider', e.target.value)}
          placeholder="e.g. Geico"
        />
      </Field>

      <Field label={`Amount (${CURRENCY_SYMBOL[currency] ?? currency})`} hint="Leave blank if none">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={draft.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder="0.00"
        />
      </Field>

      <Field label="Due / renewal date">
        <Input
          type="date"
          value={draft.dueDate}
          onChange={(e) => set('dueDate', e.target.value)}
        />
      </Field>

      <Field label="Repeats">
        <Select
          value={draft.recurrence}
          onChange={(e) => set('recurrence', e.target.value as Recurrence)}
        >
          {(['none', 'weekly', 'monthly', 'quarterly', 'yearly'] as Recurrence[]).map(
            (r) => (
              <option key={r} value={r}>
                {RECURRENCE_LABEL[r]}
              </option>
            ),
          )}
        </Select>
      </Field>

      <Field label="Account / policy #">
        <Input
          value={draft.accountNumber}
          onChange={(e) => set('accountNumber', e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <Field label="Action needed">
        <Select
          value={draft.action}
          onChange={(e) => set('action', e.target.value as ActionType)}
        >
          {(['none', 'pay', 'renew', 'cancel', 'dispute', 'call', 'sign', 'review'] as ActionType[]).map(
            (a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ),
          )}
        </Select>
      </Field>

      {draft.category === 'subscription' && (
        <Field label="How often do you use it?">
          <Select
            value={draft.usage}
            onChange={(e) => set('usage', e.target.value as Usage)}
          >
            <option value="often">Often</option>
            <option value="sometimes">Sometimes</option>
            <option value="rarely">Rarely</option>
            <option value="unknown">Not sure</option>
          </Select>
        </Field>
      )}

      <Field label="Payment method">
        <Input
          value={draft.paymentMethod}
          onChange={(e) => set('paymentMethod', e.target.value)}
          placeholder="e.g. Visa ••4291"
        />
      </Field>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10 sm:col-span-2">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Auto-pay is on
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            It'll be charged automatically — you still want a heads-up.
          </p>
        </div>
        <Toggle checked={draft.autoPay} onChange={(v) => set('autoPay', v)} />
      </div>

      <Field label="Notes" className="sm:col-span-2">
        <Textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything else worth remembering"
        />
      </Field>
    </div>
  )
}

export function AddItemModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { addItem, state } = useStore()
  const currency = state.settings.currency
  const [tab, setTab] = useState<'scan' | 'manual'>('scan')
  const [raw, setRaw] = useState('')
  const [detected, setDetected] = useState<string[]>([])
  const [scanned, setScanned] = useState(false)
  const [draft, setDraft] = useState<FormDraft>(emptyDraft())

  const set = <K extends keyof FormDraft>(k: K, v: FormDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const reset = () => {
    setTab('scan')
    setRaw('')
    setDetected([])
    setScanned(false)
    setDraft(emptyDraft())
  }

  const close = () => {
    reset()
    onClose()
  }

  const runScan = () => {
    const result = parseIntake(raw)
    const f = result.fields
    setDraft((d) => ({
      ...d,
      title: f.title ?? d.title,
      category: f.category ?? d.category,
      provider: f.provider ?? d.provider,
      amount: f.amount !== null && f.amount !== undefined ? String(f.amount) : d.amount,
      dueDate: f.dueDate ?? d.dueDate,
      recurrence: f.recurrence ?? d.recurrence,
      accountNumber: f.accountNumber ?? d.accountNumber,
      autoPay: f.autoPay ?? d.autoPay,
      action: f.action ?? d.action,
      actionNote: f.actionNote ?? d.actionNote,
    }))
    setDetected(result.detected)
    setScanned(true)
    setTab('manual')
  }

  const save = () => {
    const patch = draftToPatch(draft)
    const item = newItemFromFields(
      {
        title: patch.title,
        category: patch.category,
        provider: patch.provider,
        amount: patch.amount,
        dueDate: patch.dueDate,
        recurrence: patch.recurrence,
        accountNumber: patch.accountNumber,
        paymentMethod: patch.paymentMethod,
        autoPay: patch.autoPay,
        action: patch.action,
        actionNote: patch.actionNote,
      },
      currency,
    )
    item.usage = patch.usage
    item.notes = patch.notes
    addItem(item)
    close()
  }

  const canSave = draft.title.trim().length > 0

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title="Add something to track"
      subtitle="Paste a bill or email and let Lifeline pull out the details — or enter it yourself."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!canSave}>
            Add item
          </Button>
        </>
      }
    >
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        <TabBtn active={tab === 'scan'} onClick={() => setTab('scan')}>
          <ScanLine className="h-4 w-4" /> Paste &amp; scan
        </TabBtn>
        <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')}>
          <Wand2 className="h-4 w-4" /> Manual entry
        </TabBtn>
      </div>

      {tab === 'scan' ? (
        <div className="space-y-3">
          <Textarea
            rows={9}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Paste a bill, renewal notice, or forwarded email here…\n\nExample:\nYour Geico policy GEC-4471902 renews on 06/14/2025.\nAmount due: $712.40. Auto-pay is enabled.`}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nothing leaves your browser — parsing happens locally.
            </p>
            <Button variant="primary" onClick={runScan} disabled={!raw.trim()}>
              <Sparkles className="h-4 w-4" /> Scan it
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {scanned && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5" />
                {detected.length
                  ? 'Here’s what I pulled out — please double-check:'
                  : 'I couldn’t confidently detect fields — fill in what you can:'}
              </p>
              {detected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detected.map((d) => (
                    <span
                      key={d}
                      className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-brand-500/20 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <ItemFields draft={draft} set={set} currency={currency} />
        </div>
      )}
    </Modal>
  )
}

export function EditItemModal({
  item,
  open,
  onClose,
}: {
  item: Item
  open: boolean
  onClose: () => void
}) {
  const { updateItem, state } = useStore()
  const currency = state.settings.currency
  const [draft, setDraft] = useState<FormDraft>(() => itemToDraft(item))

  // reset when a different item is opened
  const draftKey = useMemo(() => item.id, [item.id])
  const [key, setKey] = useState(draftKey)
  if (key !== draftKey) {
    setKey(draftKey)
    setDraft(itemToDraft(item))
  }

  const set = <K extends keyof FormDraft>(k: K, v: FormDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const save = () => {
    updateItem(item.id, draftToPatch(draft))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Edit item"
      subtitle={item.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!draft.title.trim()}
          >
            Save changes
          </Button>
        </>
      }
    >
      <ItemFields draft={draft} set={set} currency={currency} />
    </Modal>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition',
        active
          ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-800 dark:text-brand-300'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
      )}
    >
      {children}
    </button>
  )
}
