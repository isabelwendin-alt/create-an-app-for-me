# Momentum ⚡

A beautiful, all-in-one **focus timer, task manager, and habit tracker** to help you build better days. Everything runs locally in your browser — no account, no backend, no keys required.

![Momentum](https://img.shields.io/badge/Vite-React-TS-Tailwind-6366f1)

## Features

- **⏱️ Focus timer** — a Pomodoro-style timer with a smooth circular progress ring, focus / short-break / long-break modes, auto-start options, session tracking, and a gentle completion chime (Web Audio, no assets). Link a session to a task to count pomodoros.
- **✅ Tasks** — add tasks with priority and pomodoro estimates, inline edit, drag to reorder, filter (all / active / done), progress bar, and one-click clear-completed.
- **🔁 Habits** — a weekly grid with per-day toggles, current & best streaks, weekly goals, custom emoji + color per habit.
- **📊 Stats** — focus minutes today / this week, focus-day streak, tasks completed, habit-goal completion, and a 14-day focus bar chart.
- **🌗 Dark / light theme**, keyboard shortcuts (`1`–`4` switch tabs), responsive layout with a mobile bottom nav.
- **💾 Local-first** — all data is saved in `localStorage`. Export / import a JSON backup or reset from Settings.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animation
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

Momentum never sends your data anywhere. Everything lives in your browser's
`localStorage` under the `momentum.v1` key. Use **Settings → Export backup** to
save a JSON copy you can import on another device.
