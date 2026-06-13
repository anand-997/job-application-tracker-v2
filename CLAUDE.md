# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server → http://localhost:3000
npm run build    # production build (also typechecks + lints — run this to verify changes)
npm start        # serve the production build
npm run lint     # next lint
```

There is **no automated test suite**. Verify changes via `npm run build` (catches all TS/lint errors) and manual browser testing.

Deploy (Vercel CLI is non-interactive here and needs an explicit scope):
```bash
VERCEL_TOKEN=<token> npx vercel@latest --prod --yes --scope <team>
```

## Big picture

A **single-page, client-only** Next.js 14 (App Router) job-application tracker. **No backend, no API routes, no AI, no required env vars** — all data lives in `localStorage` under the key `jobtracker_v3`. Deploys to Vercel as static output + the App Router shell.

`src/app/page.tsx` is the *entire* app: a `'use client'` shell (`AppShell`) wrapped in `Providers`. It owns view/search/sort/filter/modal UI state and composes every feature. There are no other routes.

### State flow — everything goes through AppProvider
`src/context/AppProvider.tsx` (`useApp()`) is the single source of truth. It holds `AppState` (`userPrefs`, `applications`, `savedFilters`), exposes all CRUD, and centralizes the invariants — **do not mutate applications directly; call its methods** so these stay consistent:
- Every status change appends to `statusHistory[]` and bumps `lastActivityDate`/`updatedAt` (`changeStatus`, `updateApplication`).
- Confetti fires **only** on a transition *to* `accepted` (deduped via `prevAcceptedRef`).
- On hydration it loads from localStorage and runs **ghost detection** (`lib/ghost-detector.ts`) — stale non-terminal apps auto-move to `ghosted`.
- Notifications are *derived* from applications each render (`lib/notifications.ts`), not stored.
- `hydrated` gates the first render (server + initial client both render a loading state, so there's no hydration mismatch). Persistence is a `useEffect` that writes the whole `AppState` on change.

Provider nesting (`src/app/Providers.tsx`): `ToastProvider → AppProvider → LangBridge(I18nProvider) → children`. `LangBridge` exists because the active language comes from `AppProvider`'s prefs.

### i18n (custom, not next-intl)
`src/i18n/I18nProvider.tsx` + `useT()`; dictionaries in `src/messages/{en,hi}.json`. `t('a.b.c', {vars})` does dotted lookup + `{var}` interpolation, falling back to English then the key. **Any new user-visible string must be added to BOTH `en.json` and `hi.json`.** Kanban columns show *bilingual* labels at all times via the `STATUS_LABELS` constant (independent of the active language).

### Theming
CSS variables in `src/app/globals.css` under `.dark`/`.light` (toggled on `<html>`); an inline anti-FOUC script in `src/app/layout.tsx` sets the class from localStorage before React mounts. Tailwind color tokens (`tailwind.config.ts`) map to these vars. **Gotcha:** semantic colors (`accent`, `error`, `warning`, `success`) are defined as `rgb(var(--x-rgb) / <alpha-value>)` so Tailwind opacity utilities like `bg-accent/10` work — there are *both* hex vars (`--accent`, used in inline `style` props) and rgb-channel vars (`--accent-rgb`, used by Tailwind).

### Key libs (`src/lib/`)
- `extract-text.ts` — **browser-only** PDF/DOCX → plain text (`pdfjs-dist` worker loaded from a CDN, `mammoth`). Stores extracted **text only, never binary**. 5 MB cap, `.pdf`/`.docx` only.
- `analytics.ts` — pure aggregation feeding `AnalyticsDashboard` (Recharts). `filtering.ts` — search/filter/sort applied in `page.tsx` via `useMemo`. `keyword-match.ts` — the no-AI résumé↔JD overlap score. `constants.ts` — status/source/priority configs + `STORAGE_KEY`.
- `AnalyticsDashboard` and `TableView` are `next/dynamic` with `ssr:false` (Recharts + bundle size).

## Conventions / constraints
- Keep the localStorage key `jobtracker_v3` and the 12 statuses in `STATUS_ORDER` stable — both are part of the data contract and the product spec.
- Zero AI by design; the "match %" is plain set math, not an LLM.
- `PRD.md` is the product spec; `README.md` documents intentional deviations from it (guest-mode-only, custom i18n, hand-built Tailwind UI instead of shadcn).
