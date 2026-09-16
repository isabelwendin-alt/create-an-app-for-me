import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export { cn }

type Variant = 'primary' | 'ghost' | 'soft' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5',
  soft: 'bg-slate-200/70 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10',
  outline:
    'border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5',
  danger:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

export function Button({
  variant = 'soft',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'no-tap-highlight inline-flex select-none items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-slate-900/50',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Tone =
  | 'neutral'
  | 'brand'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'violet'

const tones: Record<Tone, string> = {
  neutral:
    'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
  brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-500/25',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-rose-500/25',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/25',
  emerald:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25',
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/25',
  violet:
    'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/25',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const fieldBase =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(fieldBase, 'resize-y', className)} {...props} />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, 'pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      )}
    </label>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl animate-slide-up dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200/80 px-5 py-3 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/15',
      )}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/10">
      {icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      {children && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {children}
        </p>
      )}
    </div>
  )
}
