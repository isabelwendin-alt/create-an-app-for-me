import { useMemo, useState } from 'react'
import { Check, Copy, Mail, Phone } from 'lucide-react'
import type { Item } from '../lib/types'
import { buildDraft, suggestedDrafts, type DraftKind } from '../lib/drafts'
import { Button, Modal, Select, cn } from './ui'
import { useCopy } from './shared'

export function DraftModal({
  item,
  open,
  onClose,
}: {
  item: Item
  open: boolean
  onClose: () => void
}) {
  const options = useMemo(() => suggestedDrafts(item), [item])
  const [kind, setKind] = useState<DraftKind>(options[0]?.kind ?? 'inquiry')
  const [channel, setChannel] = useState<'email' | 'call'>('email')
  const [copied, copy] = useCopy()

  const draft = useMemo(() => buildDraft(item, kind), [item, kind])
  const text =
    channel === 'email' ? `Subject: ${draft.subject}\n\n${draft.email}` : draft.call

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Draft an action"
      subtitle={`${item.title} — I’ll write it, you send it.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => copy(text)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : `Copy ${channel === 'email' ? 'email' : 'script'}`}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            What do you need
          </span>
          <Select value={kind} onChange={(e) => setKind(e.target.value as DraftKind)}>
            {options.map((o) => (
              <option key={o.kind} value={o.kind}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5 sm:mt-5">
          <ChBtn active={channel === 'email'} onClick={() => setChannel('email')}>
            <Mail className="h-4 w-4" /> Email
          </ChBtn>
          <ChBtn active={channel === 'call'} onClick={() => setChannel('call')}>
            <Phone className="h-4 w-4" /> Call script
          </ChBtn>
        </div>
      </div>

      {channel === 'email' && (
        <div className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-white/5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            Subject:{' '}
          </span>
          <span className="text-slate-800 dark:text-slate-100">
            {draft.subject}
          </span>
        </div>
      )}

      <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-sans text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200">
        {channel === 'email' ? draft.email : draft.call}
      </pre>

      <p className="mt-3 text-xs text-slate-400">
        Replace anything in [brackets] before sending. Lifeline drafts — you review
        and send. For anything with real legal or financial stakes, consider a
        professional.
      </p>
    </Modal>
  )
}

function ChBtn({
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
