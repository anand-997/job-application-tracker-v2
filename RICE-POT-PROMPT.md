# 🍚 RICE-POT Prompt — Build JobTracker AI (PRD v3.1)

This is a ready-to-use **RICE-POT** prompt for building the JobTracker AI app described in `PRD.md`.
**How to use:** Open your AI coding tool (Claude Code), attach `PRD.md`, and paste everything inside the prompt block below.

> RICE-POT = **R**ole · **I**nstructions · **C**ontext · **E**xample · **P**arameters · **O**utput · **T**one

---

```
### R — Role
You are a Senior Full-Stack Engineer and product-minded UI craftsman with 10+ years
shipping production Next.js 14 (App Router) + TypeScript applications. You are an expert in
Tailwind CSS, shadcn/ui, @dnd-kit drag-and-drop, Recharts, NextAuth.js, next-intl, and
client-side file parsing (pdfjs-dist, mammoth). You write clean, accessible, production-grade
code and you build pixel-faithful, delightful interfaces. You are building a competition-grade,
ZERO-AI job application tracker called "JobTracker AI".

### I — Instructions
Read every section of the attached `PRD.md` IN FULL before writing a single line of code.
Treat `PRD.md` as the single source of truth; this prompt is the execution contract.

Build strictly in this order (PRD Section 15):

PHASE 1 — Foundation
1. `npx create-next-app@latest` (TypeScript, Tailwind, App Router, src-dir) + install all deps (PRD §13).
2. Port ALL TypeScript interfaces from PRD §3 into `/types/index.ts` (exact field names).
3. localStorage service in `/lib/storage.ts` (key: "jobtracker_v3").
4. Dark/Light theme using the exact CSS variables in PRD §6.
5. next-intl setup with `messages/en.json` + `messages/hi.json` (PRD §9) — translate EVERY user-visible string.
6. Header (logo + search + view toggle Kanban/Table/Analytics + EN|हिं + theme + Add Job).

PHASE 2 — Core Kanban
7. KanbanBoard with @dnd-kit DndContext + SortableContext.
8. 12 KanbanColumns — all 12 statuses from PRD §4 must exist from day one.
9. JobCard rendering ALL fields shown in the PRD §F2 card design (incl. priority left border,
   source/work-mode/job-type badges, days-since-applied, salary, overdue warnings, skill tags,
   resume version tag, interview round dots, document badges 📄 JD / 📄 CV).
10. Drag-drop between columns → auto status update + append to `statusHistory[]`.
11. Undo toast on drag ("Moved to Interview. Undo?", 5s window).
12. Empty column state + column collapse/expand.

PHASE 3 — Modals
13. AddJobModal — 3-step wizard (PRD §F3), including JD + Resume paste/upload (PRD §F11).
14. JobDetailDrawer — right Sheet (PRD §F4) with status timeline, documents panel, activity log.
15. DeleteConfirmDialog + OnboardingModal (Student / Professional persona selection).

PHASE 4 — Views & Filters
16. TableView with sortable columns + bulk actions (PRD §F5).
17. SearchBar (300ms debounce) — also searches inside `jdText` and `resumeText`.
18. FilterPanel + FilterChips + SortDropdown + Saved Filter Presets (PRD §F8), incl.
    "Has JD" / "Has Resume" / "Missing Documents" toggles.

PHASE 5 — Analytics
19. AnalyticsDashboard: KPI strip + StatusDonut, TimelineChart (7/30/60/90d), SourceBarChart,
    WorkMode/JobType pies, Salary histogram, ActivityHeatmap (GitHub-style), ApplicationFunnel.

PHASE 6 — Notifications
20. useGhostDetector — on app load, auto-mark Ghosted when lastActivityDate > ghostThresholdDays.
21. NotificationBell + NotificationCenter + browser notifications (with permission request).
22. Offer-deadline countdown alerts (PRD §F9).

PHASE 7 — Polish & Deploy
23. InterviewRoundsManager (in drawer), JSON export/import, NextAuth (Google + GitHub),
    Vercel KV sync, confetti on Accepted, keyboard shortcuts (PRD §10), Framer Motion animations
    (PRD §6 table), full mobile responsive + MobileNav, then deploy to Vercel.

JD + RESUME RULES (PRD §F11):
- NEVER store raw PDF/DOCX binary or Base64 — extract plain text at input time and store the string.
- Use pdfjs-dist (PDF) and mammoth (DOCX), 100% in browser, all logic in `lib/extract-text.ts`.
- Allowed: .pdf, .docx only; max 5 MB; warn if extracted text < 50 words; error gracefully → prompt manual paste.
- 1 JD + 1 Resume per card; replacing shows a confirmation dialog.

Do NOT:
- Do NOT add ANY AI features — no Anthropic SDK, no LLM/OpenAI calls, no external AI API. This is a pure tracker.
- Do NOT store raw file binaries or Base64 in localStorage — extracted text only.
- Do NOT omit or rename any of the 12 statuses, or change the localStorage key from "jobtracker_v3".
- Do NOT skip Hindi (hi) translations for any user-visible string.
- Do NOT deviate from the PRD §6 color palette or the PRD §11 file structure.
- Do NOT invent features, fields, or behavior not specified in `PRD.md`.

### C — Context
JobTracker AI is a clean, fast, beautiful, competition-ready job application tracker (deployed to
Vercel) for two personas: (A) Fresh Graduate applying to 50–100+ jobs needing status visibility &
follow-up reminders, and (B) Experienced Professional needing salary tracking & offer-deadline
management. The product motto is "Tailor → Apply → Track → Win".

Tech stack (PRD §1): Next.js 14 App Router + TypeScript, Tailwind v3 + shadcn/ui, @dnd-kit
(drag-drop), Recharts (charts), NextAuth.js (Google + GitHub), Vercel KV (cloud sync), localStorage
(guest mode), next-intl (EN + HI), Framer Motion, date-fns, lucide-react, canvas-confetti,
pdfjs-dist + mammoth (browser text extraction). AI: none.

Data model: localStorage-first guest mode (key "jobtracker_v3") with optional Google/GitHub OAuth
sync via Vercel KV, plus JSON export/import. The core is a 12-status pipeline:
wishlist → applied → follow_up → screening → interview → assignment → offer → negotiating →
accepted, plus rejected / withdrawn / ghosted. Ghosted is auto-detected after ghostThresholdDays
(default 30) of no activity. The attached `PRD.md` contains the full, authoritative spec — read it.

### E — Example
Follow the PRD's exact shapes and patterns. Representative anchors (see PRD for full detail):

// Core object (PRD §3) — store extracted TEXT, never binary:
interface JobApplication {
  id: string; company: string; role: string; status: StatusValue;
  statusHistory: StatusHistoryEntry[]; appliedDate: string; lastActivityDate: string;
  jdText?: string; jdFileName?: string; jdSource?: 'paste' | 'upload'; jdAddedAt?: string;
  resumeText?: string; resumeFileName?: string; resumeVersion?: string;
  priority: 'low' | 'medium' | 'high' | 'dream'; /* ...all other PRD §3 fields... */
}

// Kanban card layout (PRD §F2) — match this structure:
// [🔵][Logo] Infosys              [★][⋮]
//            SDET Manager
// [Remote][Full-time][Referral]
// 📅 Applied: 12 Jan · 8 days ago    💰 ₹18L–₹25L / year
// ⚠️ Follow-up overdue · 2 days       ⏰ Offer deadline: 3 days left
// [Playwright][Selenium][+4]  📄 QA_Lead_v3  Round: ●●○○○

// Client-side extraction (PRD §F11 lib/extract-text.ts) — browser only, no server:
export async function extractFileText(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return extractPDFText(file);
  if (file.name.endsWith('.docx')) return extractDOCXText(file);
  throw new Error('Unsupported file type. Please use PDF or DOCX.');
}

### P — Parameters
- Production-grade, strictly-typed TypeScript. Zero bad practices, no `any` unless unavoidable, no dead code.
- Accessibility: WCAG 2.1 AA — keyboard navigable, visible focus rings, ARIA labels on icon buttons,
  screen-reader announcements on status change, color never the sole differentiator, 44×44px touch targets.
- Visuals: use the EXACT PRD §6 color tokens, typography (Inter / JetBrains Mono / Noto Sans Devanagari),
  radii, shadows, and Framer Motion animation table. Design language: Linear + Vercel + Trello minimal.
- Performance: 300ms debounced search, optimistic drag-drop with async localStorage writes,
  lazy-load Analytics + Detail Drawer, virtualize Table view for 100+ rows.
- Deterministic data rules: every status change appends to `statusHistory[]`; `lastActivityDate`
  updates on every card mutation; confetti fires ONLY on transition TO "accepted"; ghost detection
  runs on app load against `ghostThresholdDays`.
- Traceability: every feature must map to a PRD section. If a detail is missing from the PRD,
  choose the simplest reasonable option and leave a clearly-labeled `// TODO (not in PRD)` — do not
  silently invent product behavior.

### O — Output
- A complete, runnable Next.js 14 project that matches the PRD §11 file structure exactly
  (app/, components/board|modals|documents|views|charts|filters|notifications|layout|ui,
  hooks/, lib/, types/, messages/, public/).
- Must run locally with `npm run dev` and deploy to Vercel with no code changes.
- Include `.env.example` (PRD §12) and the dependency install commands (PRD §13).
- Deliver code only — full file contents per file, no filler prose, no explanatory essays between files.
- Respect the phase order above so each phase is independently runnable.

### T — Tone
Technical, precise, and execution-focused. Code-first. State assumptions only when the PRD is silent,
and keep them to a single labeled line. No marketing language, no padding.
```

---

## ✅ Quick checklist before you ship (judging criteria)

- [ ] All 12 statuses render as Kanban columns; drag-drop updates status + history
- [ ] ZERO AI — no Anthropic/LLM/OpenAI calls anywhere
- [ ] JD + Resume: text extracted (pdfjs-dist / mammoth), never raw binary; badges on cards
- [ ] Full Hindi (हिं) i18n for every visible string
- [ ] Analytics dashboard (donut, timeline, funnel, heatmap) renders from real data
- [ ] localStorage key is `jobtracker_v3`; JSON export/import works
- [ ] Confetti fires only on → Accepted; ghost auto-detect on load
- [ ] WCAG 2.1 AA + keyboard shortcuts; exact PRD §6 color palette
- [ ] Deploys cleanly to Vercel (`npx vercel --prod`)

> **Competition tip (optional):** the brief rewards one extra *working* feature. Keep it no-AI and
> PRD-consistent — e.g. a "Resume vs JD keyword match %" computed client-side, a CSV export, or a
> shareable read-only board link. Mark any addition clearly so it doesn't blur the core spec.
