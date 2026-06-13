# 🎯 JobTracker — Your Career Command Center

A clean, fast, beautiful **job application tracker**. 12-stage Kanban pipeline, drag-and-drop,
JD + résumé text extraction, analytics, English + हिंदी, dark/light — **100% client-side, no backend, no LLM calls.**

> **Tailor → Apply → Track → Win** · Built to the PRD v3.1 spec.

### 🔴 Live demo → **https://job-application-tracker-v2.vercel.app**

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![No LLM](https://img.shields.io/badge/LLM-none-success) ![Deployed](https://img.shields.io/badge/Vercel-live-success)

---

## ✨ Features

| | Feature |
|---|---|
| 🗂️ | **12-status Kanban** (wishlist → applied → … → accepted, + rejected/withdrawn/ghosted) with `@dnd-kit` drag-and-drop |
| ↩️ | **Undo toast** on every move ("Moved to Interview. Undo?") |
| 📝 | **3-step Add/Edit wizard** — basic info, details + documents, contacts & notes |
| 📄 | **JD + Résumé per card** — paste OR upload **PDF/DOCX**; text extracted in-browser (`pdfjs-dist` + `mammoth`), **never stores binary** |
| 🎯 | **Résumé ↔ JD keyword match %** — client-side, no LLM *(bonus feature)* |
| 📊 | **Analytics** — status donut, timeline, source bar, work-mode/job-type pies, salary histogram, **GitHub-style activity heatmap**, **application funnel** |
| 🔍 | **Search** (300 ms debounce, searches inside JD + résumé text) + **filters** + **saved presets** + **sort** |
| 📋 | **Table view** — sortable columns, inline status edit, bulk actions, pagination |
| 🔔 | **Notifications** — follow-up overdue, offer deadlines, interview-tomorrow, auto-ghost; optional browser notifications |
| 👻 | **Ghost detector** — auto-marks stale applications after N days (configurable) |
| 🎉 | **Confetti** on → Accepted |
| 🌐 | **English + हिंदी** i18n for every visible string · **Dark / Light** theme |
| 💾 | **localStorage** persistence + **JSON import/export** + **CSV export** |
| ⌨️ | **Keyboard shortcuts** (Ctrl/⌘+K, N, 1–9, Esc, ?) · WCAG-minded focus rings & ARIA labels |

---

## 🚀 Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

No environment variables are required — the app runs fully in **guest mode** (localStorage).

---

## ☁️ Deploy to Vercel (free, no domain needed)

**Option A — Git + Vercel dashboard (recommended)**
1. Push this folder to a **public GitHub repo**.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** the repo.
3. Framework is auto-detected as **Next.js**. Leave everything default → **Deploy**.
4. Done — you get a public `*.vercel.app` URL.

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel --prod
```

There are **no secrets to configure**. It just works.

---

## 🧱 Tech stack

Next.js 14 (App Router, TS) · Tailwind CSS v3 · `@dnd-kit` · Recharts · Framer Motion ·
`pdfjs-dist` + `mammoth` (browser text extraction) · `date-fns` · `lucide-react` · `canvas-confetti`.

**Typography:** Bricolage Grotesque (display) · Plus Jakarta Sans (body) · JetBrains Mono · Noto Sans Devanagari (Hindi).

## 🗺️ Project structure

```
src/
  app/            layout, globals.css, page.tsx (app shell), Providers
  components/     board · modals · documents · views · charts · filters · notifications · interviews · layout · ui
  context/        AppProvider (state + CRUD), ToastProvider
  hooks/          useKeyboardShortcuts
  i18n/           I18nProvider + useT
  lib/            storage · extract-text · ghost-detector · notifications · analytics · filtering · export-import · keyword-match · sample-data · utils · constants · factory
  messages/       en.json · hi.json
  types/          index.ts
```

## 📌 Notes vs PRD

- **Guest-mode focus.** NextAuth + Vercel KV cloud sync are *optional* in the PRD and need OAuth secrets,
  so they're left as a documented add-on (`.env.example`) — the core tracker deploys with **zero config**.
- **i18n** uses a lightweight custom provider (full EN/HI coverage) instead of next-intl routing, for a robust single-build deploy.
- **UI** is hand-built on Tailwind (same UX as the shadcn component list) to avoid CLI/network setup.
- **No LLM calls anywhere** — the keyword-match feature is pure set-overlap math.

---

*Made with ❤️*
