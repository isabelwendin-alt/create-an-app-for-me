# Lifeline 🩺

Your **personal administrative assistant** — a calm home for all the "adulting"
that piles up: bills, insurance, subscriptions, renewals, warranties,
appointments, and deadlines. Paste a bill or email, and Lifeline pulls out the
details, sorts everything by what's most urgent, flags price hikes and unused
subscriptions, and drafts the emails and call scripts you need to handle them.

Everything runs **locally in your browser** — no account, no backend, no API keys.

## Features

- **📥 Smart intake** — paste a bill, renewal notice, or forwarded email and
  Lifeline extracts the provider, category, amount, due/renewal date, account or
  policy number, auto-pay status, and the action required — all with a
  rule-based parser that never leaves your browser. Or add items by hand.
- **🗂️ Tracker** — everything grouped by category and sorted by next due date,
  with overdue items surfaced at the top. Search, filter, and drill into any
  item for the full picture.
- **⚡ Overview** — a prioritized "needs attention now" briefing with a one-line
  action for each item ("Renew/confirm Geico in 6 days — was $604.10"), plus
  monthly recurring spend, upcoming items, and where your money goes.
- **💡 Insights & savings** — flags **price increases** (with before/after),
  **duplicate or overlapping subscriptions** (two music services?), and
  **rarely-used** subscriptions worth cancelling — with an estimated monthly
  saving.
- **✍️ Draft actions** — one click generates a ready-to-send **email** and a
  **phone call script** for cancelling a subscription, disputing a charge,
  questioning a renewal, or confirming an appointment. Copy and go.
- **📋 Recap** — a "state of your admin" summary: what's overdue, what's due in
  the next two weeks, and what you've resolved — copyable as plain text.
- **🌗 Dark / light theme**, responsive layout with a mobile bottom nav, and
  **local-first** storage with JSON export / import.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) icons, [date-fns](https://date-fns.org/) for dates

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build (dist/)
```

### Single-file preview build

`npm run build:preview` produces a fully self-contained `dist-preview/index.html`
with all JS/CSS inlined — open it directly in any browser, no server needed.

## Data & privacy

Lifeline never sends your data anywhere. Everything — including the intake
parsing — happens on-device and is saved in your browser's `localStorage` under
the `lifeline.v1` key. Use **Settings → Export** to save a JSON copy you can
import on another device.

## Not a substitute for a professional

Lifeline organizes and drafts — you review and send. For anything with real
legal or financial stakes (large insurance disputes, tax filings), it gives you
factual next steps and suggests consulting a professional for the actual
decision.
