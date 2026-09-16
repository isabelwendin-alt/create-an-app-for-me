export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/** Normalize a provider name for loose matching (lowercase, strip punctuation). */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
