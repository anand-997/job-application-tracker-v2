# 🏆 JobTracker AI — World's Best Job Application Tracker
## PRD v3.2 — FINAL (No AI Features)
### Clean • Fast • Beautiful • Competition-Ready → Vercel Deploy

> **v3.2 addendum:** This PRD now folds in the **Calendar** feature (§5 · F12) and the
> **linked disk-folder auto-backup** (§8). See **§16 — Implementation Notes & Changelog**
> for what was actually built and where the shipped app intentionally deviates from the
> original v3.1 stack (custom i18n + hand-built Tailwind UI, guest-mode only, no shadcn/next-intl).

---

## 📌 EXECUTIVE SUMMARY

| Item | Value |
|------|-------|
| **Product Name** | JobTracker AI |
| **Tagline** | *"Your Career Command Center — Tailor → Apply → Track → Win"* |
| **Version** | v3.1 — No AI, Pure Tracker |
| **Deploy** | Vercel.com |
| **Tech Stack** | Next.js 14 + Tailwind CSS + shadcn/ui |
| **Personas** | Fresh Graduate + Experienced Professional |
| **Language** | English + Hindi |
| **Theme** | Dark / Light toggle |
| **Data** | localStorage (guest) + **linked disk-folder auto-backup** (File System Access API) + JSON export/import |
| **Views** | Kanban · Table · Analytics · **Calendar (Month / Week)** |
| **Documents** | 1 JD + 1 Resume per card — paste text OR upload PDF/DOCX (text extracted, stored in JSON) |
| **AI** | ❌ None |

---

## 🗂️ TABLE OF CONTENTS

1. Tech Stack
2. User Personas
3. Core Data Model (TypeScript)
4. Application Status Pipeline (12 statuses)
5. Features F1–F12 (F12 = Calendar)
6. UI/UX Specifications
7. Kanban Board Spec
8. Auth & Data Persistence (incl. linked disk-folder backup)
9. i18n English + Hindi
10. Performance & Accessibility
11. File Structure
12. Environment Variables
13. Deployment Guide
14. Competition Edge Features
15. Claude Code Starter Prompt
16. Implementation Notes & Changelog (v3.1 → v3.2)

---

## 1. TECH STACK

```
Framework:      Next.js 14 (App Router, TypeScript)
Styling:        Tailwind CSS v3 + shadcn/ui
Drag & Drop:    @dnd-kit/core + @dnd-kit/sortable
Charts:         Recharts
Auth:           NextAuth.js (Google + GitHub OAuth)
DB (cloud):     Vercel KV (Redis) — synced login users
DB (local):     localStorage — guest mode
File I/O:       JSON export / import
File Parsing:   pdfjs-dist (PDF → text, browser) + mammoth (DOCX → text, browser)
Icons:          Lucide React
Animations:     Framer Motion
Date:           date-fns
i18n:           next-intl (EN + HI)
Confetti:       canvas-confetti
Deploy:         Vercel
AI:             ❌ Not used
```

---

## 2. USER PERSONAS

### 🎓 Persona A — Fresh Graduate / Student
- Applying to 50–100+ jobs on Naukri, Unstop, Internshala, LinkedIn
- Needs: clear status visibility, follow-up reminders, application count
- Pain: loses track of which company is at what stage

### 💼 Persona B — Experienced Professional
- Strategic search, quality over quantity
- Uses LinkedIn, company portals, referrals
- Needs: salary tracking, offer deadline management, timeline view

### Persona Toggle (Onboarding)
- "I am a..." → 🎓 Student / 💼 Professional
- Student: motivational stats, application count goal
- Professional: salary benchmarks, offer deadline alerts

---

## 3. CORE DATA MODEL

```typescript
// ── Primary Application Object ─────────────────────────────
interface JobApplication {
  id: string;                         // UUID v4

  // Core Info
  company: string;                    // Required
  role: string;                       // Required
  location: string;
  jobUrl: string;                     // Original posting URL
  source: SourceValue;
  sourceCustom?: string;              // If source = "other"

  // Status
  status: StatusValue;
  statusHistory: StatusHistoryEntry[];

  // Dates
  appliedDate: string;                // ISO
  followUpDate?: string;
  interviewDate?: string;
  offerDate?: string;
  responseDeadline?: string;          // Offer response deadline
  lastActivityDate: string;           // Updated on every change

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: 'INR' | 'USD' | 'EUR' | 'GBP';
  salaryType: 'annual' | 'monthly';
  offerAmount?: number;

  // Job Details
  jobType: JobType;
  workMode: 'remote' | 'onsite' | 'hybrid';
  experienceRequired?: string;
  skills: string[];                   // Manually added tags

  // ── Job Description (1 per card) ──────────────────────────
  jdText?: string;                    // Extracted / pasted full JD text
  jdFileName?: string;                // Original filename — display only e.g. "Infosys_SDET.pdf"
  jdSource?: 'paste' | 'upload';     // How it was added
  jdAddedAt?: string;                 // ISO timestamp
  // hasJD: computed → !!jdText (do not store)

  // ── Resume (1 per card — the version used for this job) ───
  resumeText?: string;                // Extracted / pasted full resume text
  resumeFileName?: string;            // Original filename — display only e.g. "QA_Lead_v3.pdf"
  resumeVersion?: string;             // User label e.g. "QA_Lead_v3", "SDE_Resume_v2"
  resumeSource?: 'paste' | 'upload'; // How it was added
  resumeAddedAt?: string;             // ISO timestamp
  // hasResume: computed → !!resumeText (do not store)

  // Contacts
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  hiringManagerName?: string;
  referralName?: string;

  // Notes & Meta
  notes: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'dream';
  isFavorite: boolean;
  cardColor?: string;

  // Interview Rounds (manual tracking)
  interviewRounds: InterviewRound[];

  // Rejection
  rejectionReason?: string;
  rejectionFeedback?: string;

  // Meta
  createdAt: string;
  updatedAt: string;
}

// ── Source / Platform ──────────────────────────────────────
type SourceValue =
  | 'linkedin' | 'naukri' | 'indeed' | 'unstop'
  | 'internshala' | 'glassdoor' | 'angellist'
  | 'company_portal' | 'referral' | 'other';

const SOURCE_CONFIG: Record<SourceValue, {
  label: string; color: string; icon: string;
}> = {
  linkedin:       { label: 'LinkedIn',       color: '#0077B5', icon: '🔵' },
  naukri:         { label: 'Naukri',         color: '#EF4444', icon: '🔴' },
  indeed:         { label: 'Indeed',         color: '#2164F3', icon: '🔷' },
  unstop:         { label: 'Unstop',         color: '#8B5CF6', icon: '🟣' },
  internshala:    { label: 'Internshala',    color: '#10B981', icon: '🟢' },
  glassdoor:      { label: 'Glassdoor',      color: '#0CAA41', icon: '🪞' },
  angellist:      { label: 'AngelList',      color: '#000000', icon: '⚫' },
  company_portal: { label: 'Company Portal', color: '#F59E0B', icon: '🏢' },
  referral:       { label: 'Referral',       color: '#EC4899', icon: '🤝' },
  other:          { label: 'Other',          color: '#6B7280', icon: '🌐' },
};

// ── Status ─────────────────────────────────────────────────
type StatusValue =
  | 'wishlist' | 'applied' | 'follow_up' | 'screening'
  | 'interview' | 'assignment' | 'offer' | 'negotiating'
  | 'accepted' | 'rejected' | 'withdrawn' | 'ghosted';

type JobType =
  | 'fulltime' | 'parttime' | 'contract'
  | 'internship' | 'freelance';

// ── Interview Round (manual) ───────────────────────────────
interface InterviewRound {
  id: string;
  roundNumber: number;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'hr' | 'assignment' | 'final';
  scheduledDate?: string;
  completedDate?: string;
  interviewer?: string;
  notes?: string;
  outcome?: 'passed' | 'failed' | 'pending' | 'cancelled';

  // ── Calendar addon (v3.2) — all optional, backward compatible ──
  scheduledTime?: string;        // "14:30" — 24h HH:mm
  durationMinutes?: number;      // 30 | 45 | 60 | 90 | 120 — default 60
  timezone?: string;             // e.g. "Asia/Kolkata"
  meetLink?: string;             // Google Meet / Zoom / Teams URL
  meetPlatform?: MeetPlatform;
  location?: string;             // office address — shown when onsite / in_person
  interviewerEmail?: string;
  preparationNotes?: string;
  reminderMinutes?: number;      // browser notification before event: 15 | 30 | 60 | 1440
}

type MeetPlatform =
  | 'google_meet' | 'zoom' | 'teams' | 'phone' | 'in_person' | 'other';

// ── Calendar Event (v3.2) — COMPUTED at render time from applications[].
//    NEVER stored in AppState/localStorage. Persistence is implicit: the
//    InterviewRound fields + application dates it derives from are part of
//    applications[], which already saves to localStorage and the linked
//    disk-folder backup (see §8). ──
type CalendarEventType =
  | 'interview_round' | 'follow_up' | 'offer_deadline'
  | 'applied' | 'offer_received' | 'interview_scheduled';

interface CalendarEvent {
  id: string;                    // `${applicationId}_${type}_${roundId|kind}`
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  color: string;                 // per-type hex (see F12 color table)
  colorLabel: string;
  date: string;                  // "YYYY-MM-DD"
  time?: string;                 // "14:30" — undefined = all-day
  endTime?: string;              // time + durationMinutes
  durationMinutes?: number;
  isAllDay: boolean;
  isToday: boolean;
  isPast: boolean;
  isOverdue: boolean;
  applicationId: string;
  roundId?: string;
  company: string;
  role: string;
  source: SourceValue;
  meetLink?: string;
  meetPlatform?: MeetPlatform;
  location?: string;
  interviewer?: string;
  preparationNotes?: string;
  reminderMinutes?: number;
  clickAction: 'open_round_modal' | 'open_job_drawer';
}

// ── Status History ─────────────────────────────────────────
interface StatusHistoryEntry {
  status: StatusValue;
  timestamp: string;
  note?: string;
  changedBy: 'user' | 'auto_ghost';
}

// ── App State ──────────────────────────────────────────────
interface AppState {
  version: '3.0';
  userPrefs: UserPrefs;
  applications: JobApplication[];
  savedFilters: SavedFilter[];
  lastExported?: string;
}

interface UserPrefs {
  theme: 'dark' | 'light';
  language: 'en' | 'hi';
  persona: 'student' | 'professional';
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  ghostThresholdDays: number;         // Default: 30
  defaultWorkMode?: 'remote' | 'onsite' | 'hybrid';
  name?: string;
  noticePeriodDays?: number;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

interface FilterState {
  status?: StatusValue[];
  source?: SourceValue[];
  priority?: string[];
  workMode?: string[];
  dateRange?: { from: string; to: string };
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
}
```

---

## 4. APPLICATION STATUS PIPELINE

```
┌──────────┐  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐
│ WISHLIST │─▶│ APPLIED │─▶│FOLLOW-UP │─▶│ SCREENING │─▶│ INTERVIEW │
│ 💭       │  │ 📤      │  │ 📬       │  │ 📞        │  │ 🎯        │
│इच्छा सूची│  │ आवेदित  │  │फ़ॉलो-अप  │  │स्क्रीनिंग │  │साक्षात्कार│
└──────────┘  └─────────┘  └──────────┘  └───────────┘  └───────────┘
                                                               │
              ┌──────────┐  ┌──────────┐  ┌──────────┐       │
              │ ACCEPTED │◀─│  OFFER   │◀─│NEGOTIATE │◀──────┘
              │ 🎉       │  │ 💰       │  │ 🤝       │
              │ स्वीकृत  │  │प्रस्ताव  │  │  वार्ता  │
              └──────────┘  └──────────┘  └──────────┘
                                 │
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ REJECTED │  │WITHDRAWN │  │ GHOSTED  │
              │ ❌       │  │ 🚪       │  │ 👻       │
              │अस्वीकृत │  │वापस लिया │  │जवाब नहीं │
              └──────────┘  └──────────┘  └──────────┘
                                               ▲
                         Auto-detected after {ghostThresholdDays} days
```

### Status Reference Table

| # | Status | EN Label | HI Label | Color | Icon | Auto-Trigger |
|---|--------|----------|----------|-------|------|-------------|
| 1 | wishlist | Wishlist | इच्छा सूची | `#6366F1` | 💭 | — |
| 2 | applied | Applied | आवेदित | `#3B82F6` | 📤 | — |
| 3 | follow_up | Follow-up | फ़ॉलो-अप | `#F59E0B` | 📬 | 7 days after applied |
| 4 | screening | Screening | स्क्रीनिंग | `#8B5CF6` | 📞 | — |
| 5 | interview | Interview | साक्षात्कार | `#EC4899` | 🎯 | — |
| 6 | assignment | Assignment | असाइनमेंट | `#14B8A6` | 📝 | — |
| 7 | offer | Offer | प्रस्ताव | `#10B981` | 💰 | — |
| 8 | negotiating | Negotiating | वार्ता | `#F97316` | 🤝 | — |
| 9 | accepted | Accepted | स्वीकृत | `#22C55E` | 🎉 | Confetti! |
| 10 | rejected | Rejected | अस्वीकृत | `#EF4444` | ❌ | — |
| 11 | withdrawn | Withdrawn | वापस लिया | `#6B7280` | 🚪 | — |
| 12 | ghosted | Ghosted | जवाब नहीं | `#374151` | 👻 | 30+ days no update |

---

## 5. FEATURES (F1–F10)

---

### F1 — KANBAN BOARD (Primary View)

**Layout:**
- 12 status columns, horizontally scrollable
- Drag-and-drop cards between columns using `@dnd-kit`
- Each column independent vertical scroll
- Full viewport height minus header

**Column Header:**
- Status icon + EN name + HI name below
- Count badge (number of cards)
- Collapse / expand toggle
- Add (+) button

**Empty Column State:**
- Small illustration
- Text: "No applications here yet"
- "+ Add job" CTA button

**Drag Behaviour:**
- Card scales to 1.02 + shadow lift on drag
- Drop zone: column border glows with status colour
- On drop: status auto-updates + appends to statusHistory
- Undo toast: "Moved to Interview. Undo?" — 5 second timeout

---

### F2 — JOB CARD (Kanban Card Design)

```
┌────────────────────────────────────────────┐
│ [🔵] [Logo]  Infosys              [★] [⋮] │ ← source + logo + star + menu
│              SDET Manager                  │
│ ─────────────────────────────────────────  │
│ [Remote] [Full-time] [Referral]            │ ← badges
│ 📅 Applied: 12 Jan · 8 days ago           │
│ 💰 ₹18L – ₹25L / year                    │
│                                            │
│ ⚠️ Follow-up overdue · 2 days             │ ← red warning
│ ⏰ Offer deadline: 3 days left            │ ← amber warning
│                                            │
│ [Playwright] [Selenium] [+4 more]         │ ← skill tags
│ 📄 QA_Lead_v3                             │ ← resume version tag
│ Round: ●●○○○  Interview                  │ ← progress dots
└────────────────────────────────────────────┘
```

**Card fields visible:**
- Source icon + Company logo (Clearbit API, fallback = coloured initials)
- Company name + Role
- Source badge + Work Mode badge + Job Type badge
- Applied date + days since applied
- Salary range (if entered)
- Follow-up overdue warning (red, if followUpDate is past)
- Offer deadline warning (amber, if responseDeadline within 3 days)
- Skill tags (first 3 + "+N more")
- Resume version tag
- Interview round progress dots
- Priority left border (low=gray, medium=blue, high=orange, dream=gold)
- Favourite star ⭐
- Context menu ⋮

**Card Context Menu (⋮):**
- Edit Application
- Open Job Posting ↗
- Copy Job URL
- Change Status → (submenu with all 12)
- Add Interview Round
- Duplicate
- Archive
- Delete (with confirmation)

---

### F3 — ADD / EDIT JOB MODAL (3-step wizard)

**Step 1 — Basic Info:**
- Company Name (required) → logo auto-fetched from Clearbit
- Job Title / Role (required)
- Job URL (paste link)
- Source (icon selector — all 10 platforms + "Other" with custom text input)
- Status (default: Applied)
- Applied Date (date picker, default: today)
- Work Mode: Remote / Hybrid / Onsite (toggle)
- Job Type: Full-time / Part-time / Contract / Internship / Freelance
- Location (city or "Remote")

**Step 2 — Details + Documents:**
- Salary Min + Max + Currency (INR/USD/EUR/GBP) + Type (Annual/Monthly)
- Experience Required (free text: "3–5 years")
- Skills (tag input — type and press Enter)
- ATS Platform (optional: Greenhouse / Lever / Other)

- **Job Description** — toggle: Paste | Upload
  - Paste tab: textarea "Paste the full JD here (copy from LinkedIn / Naukri)..."
  - Upload tab: drag-and-drop zone for `.pdf` or `.docx` (max 5 MB) → text auto-extracted
  - Status line: "✅ 847 words extracted from Infosys_SDET.pdf" | "⚠️ No JD added yet"
  - [View extracted text] [Clear] links

- **Resume Used** — toggle: Paste | Upload
  - Version label field (text): e.g. "QA_Lead_v3", "SDE_Resume_v2" — required if attaching
  - Paste tab: textarea "Paste your resume text here..."
  - Upload tab: drag-and-drop zone for `.pdf` or `.docx` (max 5 MB) → text auto-extracted
  - Status line: "✅ 612 words extracted from QA_Lead_v3.pdf" | "⚠️ No resume added yet"
  - [View extracted text] [Clear] links

**Step 3 — Contacts & Notes:**
- Recruiter Name
- Recruiter Email
- Recruiter LinkedIn URL
- Referral Name (if referred)
- Follow-up Date (date picker)
- Offer Response Deadline (date picker — shown if status = offer/negotiating)
- Priority: Low / Medium / High / Dream Job ⭐
- Tags (custom free tags)
- Notes (textarea — rich text if feasible, else plain)
- Card Colour (6 colour swatches)

**Footer CTAs:** "Save" | "Save & Add Another" | "Cancel"
**Validation:** Company + Role required. Show inline errors.

---

### F4 — JOB DETAIL DRAWER (Right-side panel)

Clicking any card opens a right-side drawer (Sheet component):

**Sections:**
1. **Header** — company logo + name + role + source badge + star + edit button + close
2. **Status Bar** — current status pill + "Change Status" dropdown
3. **Status Timeline** — vertical timeline of all status changes with timestamps
4. **Key Info** — grid: Applied Date | Work Mode | Job Type | Location | Salary | ATS Platform
5. **Documents** — JD + Resume panel (see F11 for full spec)
6. **Interview Rounds** — add/edit/delete rounds manually (see F7)
7. **Contacts** — recruiter info with copy buttons + LinkedIn icon link
8. **Dates** — Follow-up date | Interview date | Offer deadline (with overdue indicators)
9. **Skills** — tag cloud
10. **Notes** — full notes (read + inline edit)
11. **Activity Log** — auto-generated list of all changes: "Status changed to Interview · 3 days ago"
12. **Danger Zone** — Delete button (with confirmation)

---

### F5 — TABLE / SPREADSHEET VIEW

Toggle from Kanban → Table via view switcher in header.

**Columns (all sortable):**
Company | Role | Status | Source | Work Mode | Resume Version | Salary | Applied Date | Follow-up | Days Since Applied | Priority | Actions

**Features:**
- Click column header to sort (asc/desc)
- Inline status change via dropdown in cell
- Row click → opens Detail Drawer
- Bulk select (checkbox per row)
- Bulk actions: Change Status | Delete | Export selected
- Pagination: 25 / 50 / 100 rows per page

---

### F6 — ANALYTICS DASHBOARD

Toggle via view switcher. No AI — all pure data aggregation.

**KPI Strip (top row of cards):**
- Total Applications
- Active (not rejected / withdrawn / ghosted)
- In Interview (count)
- Offers Received
- Accepted (count)
- Average Days to Response
- Ghost Rate %

**Charts (Recharts):**
1. **Applications by Status** — Donut chart with legend
2. **Applications Over Time** — Line chart, toggle: 7d / 30d / 60d / 90d / All
3. **Source Effectiveness** — Bar chart: applications per source (LinkedIn vs Naukri vs etc.)
4. **Work Mode Split** — Pie: Remote vs Hybrid vs Onsite
5. **Job Type Split** — Pie: Full-time vs Contract vs Internship
6. **Salary Range Distribution** — Histogram (if salary data exists)
7. **Activity Heatmap** — GitHub-style calendar of application activity
8. **Application Funnel** — Sankey-style: Applied → Screening → Interview → Offer → Accepted

**Summary Stats Panel:**
- Most active day of week
- Most used source
- Most common rejection stage
- Longest active application (days)

---

### F7 — INTERVIEW ROUNDS TRACKER (Manual)

Accessible inside Job Detail Drawer (F4).

**Per Round:**
- Round Number (auto-increment)
- Type: Phone / Video / Onsite / Technical / HR / Assignment / Final
- Scheduled Date (date + time picker)
- Completed Date
- Interviewer Name
- Outcome: ✅ Passed / ❌ Failed / ⏳ Pending / 🚫 Cancelled
- Notes (textarea)

**Visual:**
- Progress dots on card: ●●○○○ (completed / total)
- Round list in drawer shows timeline of all rounds
- Overdue round (scheduled date passed, no outcome) shows red indicator

---

### F8 — SEARCH, FILTER & SORT

**Search Bar (header):**
- Searches: company, role, notes, tags, recruiter name, resume version
- Debounced 300ms
- Highlights matching text in results

**Filter Panel (side drawer or popover):**
- Status (multi-select checkboxes)
- Source (multi-select with icons)
- Priority (multi-select)
- Work Mode (toggle buttons)
- Job Type (toggle buttons)
- Date Range: Applied Date from / to
- Salary Range: slider (min / max)
- Tags (multi-select from existing tags)
- Has Follow-up Overdue (toggle)
- Has Offer Deadline Soon (toggle)

**Sort:**
- Newest First (default)
- Oldest First
- Company A–Z
- Priority (High → Low)
- Days Since Applied (most → least)
- Salary (High → Low)

**Saved Filter Presets:**
- Save current filter as named preset
- "Active High Priority"
- "Overdue Follow-ups"
- "Offers This Month"
- Delete saved presets

**Active filter chips** displayed below search bar. Click chip to remove.

---

### F9 — NOTIFICATIONS & REMINDERS

**In-app notification bell** with unread badge count.

**Notification Types:**
| Type | Trigger | Message |
|------|---------|---------|
| Follow-up due | followUpDate = today | "Follow up with [Company] today" |
| Follow-up overdue | followUpDate < today | "Follow-up overdue — [Company] · [N] days" |
| Offer deadline | responseDeadline in ≤ 3 days | "Offer from [Company] expires in [N] days" |
| Offer expired | responseDeadline < today | "Offer from [Company] has expired" |
| Auto-ghosted | 30+ days no activity | "[N] applications auto-marked as Ghosted" |
| Interview tomorrow | interviewDate = tomorrow | "Interview at [Company] tomorrow" |

**Browser Notifications:**
- Request permission on first use
- Same triggers as in-app
- Click notification → opens relevant job card

**Notification Center:**
- Bell icon in header
- Dropdown list of all active notifications
- Mark all as read
- Click item → opens job detail drawer

---

### F10 — SETTINGS & PREFERENCES

**Appearance:**
- Theme: Dark / Light toggle
- Language: English / हिंदी

**Profile:**
- Name (used in UI greeting)
- Persona: Student / Professional
- Default Currency: INR / USD / EUR / GBP
- Default Work Mode: Remote / Hybrid / Onsite
- Notice Period: 0 / 30 / 60 / 90 days

**Tracker Behaviour:**
- Ghost Threshold: slider (15 / 30 / 45 / 60 days) — default 30
- Auto-archive rejected after N days (optional)

**Notifications:**
- Toggle each notification type on/off
- Browser notification permission toggle

**Data Management:**
- Export all data as JSON (one-click)
- Import from JSON (drag & drop or browse)
- Clear all data (confirmation required — type "DELETE" to confirm)

**Keyboard Shortcuts Reference:**
- Displayed as a help table in settings

**About:**
- Version number
- Made with ❤️ for the competition
- TheTestingAcademy credit

---

### F11 — DOCUMENTS: JD + RESUME PER CARD

#### Storage Architecture Decision

**Rule: Never store raw binary files. Always extract text at input time and store the text string.**

| Approach | Verdict | Why |
|----------|---------|-----|
| Store raw PDF binary | ❌ Rejected | 1 PDF fills the entire 5 MB localStorage quota |
| Store as Base64 | ❌ Rejected | +33% size bloat, JSON export becomes huge |
| **Extract text → store text** | ✅ **Chosen** | Tiny, fast, exportable, searchable |

**Size safety check:**

| Scenario | Approx size |
|----------|-------------|
| 1 JD text (full) | ~5–8 KB |
| 1 Resume text | ~4–8 KB |
| Both per card | ~10–16 KB |
| 50 cards with both | ~750 KB |
| 100 cards with both | ~1.5 MB |
| localStorage limit | **5 MB — safe ✅** |

#### Input Methods (both supported)

```
┌─ Job Description ─────────────────────────────────────────┐
│  [ 📋 Paste text ]  [ 📄 Upload PDF / DOCX ]              │
│                                                            │
│  PASTE TAB:                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Paste the full job description here...               │  │
│  │ (copy from LinkedIn / Naukri / company site)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  UPLOAD TAB:                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📄 Drop PDF or DOCX here, or click to browse        │  │
│  │  Supported: .pdf, .docx · Max 5 MB                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ✅ 847 words extracted · Infosys_SDET.pdf  [View] [Clear] │
└────────────────────────────────────────────────────────────┘

┌─ Resume Used ──────────────────────────────────────────────┐
│  Version label: [ QA_Lead_v3              ]                │
│  [ 📋 Paste text ]  [ 📄 Upload PDF / DOCX ]              │
│  ✅ 612 words extracted · QA_Lead_v3.pdf  [View] [Clear]  │
└────────────────────────────────────────────────────────────┘
```

#### Documents Panel in Job Detail Drawer

```
┌─ Documents ────────────────────────────────────────────────┐
│                                                            │
│  📄 Job Description                                        │
│  Infosys_SDET_JD.pdf · Added 15 Jan · 847 words           │
│  [ 👁 View full JD ]  [ 📋 Copy text ]  [ 🗑 Remove ]     │
│  ──────────────────────────────────────────────────────    │
│  📄 Resume                                                 │
│  QA_Lead_v3.pdf · Version: QA_Lead_v3 · 612 words         │
│  [ 👁 View resume ]  [ 📋 Copy text ]  [ 🗑 Remove ]      │
│                                                            │
│  [ + Add JD ]  [ + Add Resume ]  ← shown only if missing  │
└────────────────────────────────────────────────────────────┘
```

#### Text Viewer Modal (opened by "View" button)

```
┌─ Job Description — Infosys SDET Manager ──────────────────┐
│  [ 🔍 Search within text...            ]                   │
│  ─────────────────────────────────────────────────────     │
│  We are looking for a Senior SDET with 5+ years            │
│  experience in Playwright, Selenium, API testing...        │
│  (scrollable, monospace, full text)                        │
│                                         [ 📋 Copy all ]   │
└────────────────────────────────────────────────────────────┘
```

#### Job Card Indicators

Two small document badges shown at the bottom of every Kanban card:

```
[ 📄 JD ] [ 📄 CV ]    ← both attached — teal filled badge
[ 📄 JD ] [ ○ CV ]    ← JD only — CV badge gray/outline
[ ○ JD ]  [ ○ CV ]    ← nothing attached — both outline
```

#### Filter Support

New filters added to F8 Filter Panel:
- "Has JD" toggle (cards with jdText present)
- "Has Resume" toggle (cards with resumeText present)
- "Missing Documents" toggle (cards with neither)

#### Search Support

Global search (F8 SearchBar) also searches inside `jdText` and `resumeText` fields.
Debounced 300ms — same as other search fields.

#### Client-Side Text Extraction Libraries

```typescript
// lib/extract-text.ts
// Both libraries run 100% in the browser — no server, no API needed

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1)
        .then(p => p.getTextContent())
        .then(c => c.items.map((item: any) => item.str).join(' '))
    )
  );
  return pages.join('\n').trim();
}

export async function extractDOCXText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// Router — picks extractor by file type
export async function extractFileText(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractPDFText(file);
  }
  if (file.name.endsWith('.docx')) {
    return extractDOCXText(file);
  }
  throw new Error('Unsupported file type. Please use PDF or DOCX.');
}
```

#### JSON Export Example (with documents)

```json
{
  "id": "abc-123",
  "company": "Infosys",
  "role": "SDET Manager",
  "status": "interview",

  "jdText": "We are looking for a Senior SDET with 5+ years experience in Playwright...",
  "jdFileName": "Infosys_SDET_JD.pdf",
  "jdSource": "upload",
  "jdAddedAt": "2025-01-15T10:30:00Z",

  "resumeText": "Pramod Dutta | SDET Manager\nSkills: Playwright, Selenium, Python...",
  "resumeFileName": "QA_Lead_v3.pdf",
  "resumeVersion": "QA_Lead_v3",
  "resumeSource": "upload",
  "resumeAddedAt": "2025-01-15T10:31:00Z"
}
```

#### Validation Rules

| Rule | Detail |
|------|--------|
| File types allowed | `.pdf`, `.docx` only |
| Max file size | 5 MB per file |
| Word count warning | Show warning if extracted text < 50 words ("This seems short — was the file scanned/image-based?") |
| Empty extraction | Show error: "Could not extract text. Try copying and pasting the content instead." |
| Both optional | Cards work fine with no documents attached |
| 1 JD per card | Uploading a new JD replaces the old one (show confirmation: "Replace existing JD?") |
| 1 Resume per card | Same — replacing shows confirmation |

---

### F12 — CALENDAR (Month + Week)  *(v3.2)*

A calendar surface that shows every job-related date and interview event. It is a
**read-only derived view** — `generateCalendarEvents(applications)` computes events at
render time. There is **no separate event store and no new localStorage key**; events are
recomputed each render from `applications[]`, so they persist for free via localStorage and
the linked disk-folder backup (§8). The expanded `InterviewRound` fields (time, meet link,
etc.) are the only new persisted data and are all optional → no export-schema bump.

> **Implementation note:** the app is a single-page, client-only shell, so Calendar ships as
> a fourth **view** (`ViewMode = 'calendar'`), lazy-loaded like Analytics — *not* as a
> `/calendar` route. It is built with the existing hand-rolled UI primitives + custom i18n
> (no shadcn, no `next-intl`) and plain CSS-Grid (no calendar library). `date-fns` is used
> for date math.

#### Event types & colors

| `type` | Source field | Timing | Color | Click → |
|--------|--------------|--------|-------|---------|
| `interview_round` | `InterviewRound.scheduledDate` (+`scheduledTime`) | timed | Purple `#7F77DD` | Job drawer (rounds editor) |
| `follow_up` | `followUpDate` | all-day | Amber `#EF9F27` | Job drawer |
| `offer_deadline` | `responseDeadline` | all-day | Red `#E24B4A` | Job drawer |
| `applied` | `appliedDate` | all-day | Blue `#378ADD` | Job drawer |
| `offer_received` | `offerDate` | all-day | Green `#639922` | Job drawer |
| `interview_scheduled` | `interviewDate` | all-day | Pink `#D4537E` | Job drawer |

Overdue events (past `follow_up` / `offer_deadline`) keep their color but add a red ⚠ + strikethrough.

> The requirement's `open_round_modal` action maps to opening the **Job Detail drawer**
> (which hosts `InterviewRoundsManager`); there is no standalone round modal in this app.

#### Updated Interview Round form (F7 extension)

The round editor in the Job Detail drawer gains, alongside the existing type / outcome / date /
interviewer fields:

| Field | Control | Default | Rule |
|-------|---------|---------|------|
| `scheduledTime` | time (HH:mm) | — | optional |
| `durationMinutes` | select | 60 | 30 / 45 / 60 / 90 / 120 |
| `interviewerEmail` | email | — | optional |
| `meetPlatform` | select | google_meet | google_meet / zoom / teams / phone / in_person / other |
| `meetLink` | url | — | hidden when platform = phone / in_person |
| `location` | text | — | shown when type = onsite **or** platform = in_person |
| `reminderMinutes` | select | 30 | none / 15 / 30 / 60 / 1440 |
| `preparationNotes` | textarea | — | max 500 chars |

#### Page layout

```
[← June 2026 →] [Today]            [Month | Week]  [Filters ▾]
[● legend: Interview · Follow-up · Offer · Applied · …]
┌───────────────────────────────────┬──────────────────────┐
│ MONTH or WEEK grid (flex-1)        │ UPCOMING rail (≥1024) │
└───────────────────────────────────┴──────────────────────┘
```

- **Month view** — 7-col CSS Grid; today = filled accent circle + cell ring; up to 3 event
  pills per cell + "+N more" popover. Rows fit the viewport when there's room and **scroll**
  when it's short (no clipped weeks).
- **Week view** — 60px time gutter, 8:00–20:00 in 30-min rows; all-day strip on top; timed
  blocks sized by duration; a **live red current-time line** in today's column (updates each minute).
- **Event popover** — title, date/time range, interviewer, meet link (open ↗ + copy), prep
  notes, and Edit-round / Open-job actions.
- **Upcoming rail** — events grouped Today / Tomorrow / This Week / Next Week / Later
  (desktop only, hidden < 1024px).
- **Filters** — toggle event types, filter by source, and All vs Active-only applications.
- **Reminders** — `useCalendarReminders` schedules `setTimeout` browser `Notification`s for
  timed rounds with `reminderMinutes` firing within 24h; permission requested on first
  Calendar mount. Pure browser API, no backend.

#### New files

```
src/lib/calendar-events.ts        # generateCalendarEvents() — pure
src/lib/calendar-utils.ts         # grid math, grouping, time geometry
src/hooks/useCalendarReminders.ts # browser-notification scheduling
src/components/views/CalendarView.tsx           # root view (lazy-loaded)
src/components/calendar/CalendarHeader.tsx
src/components/calendar/CalendarFilters.tsx
src/components/calendar/CalendarLegend.tsx
src/components/calendar/MonthView.tsx
src/components/calendar/WeekView.tsx
src/components/calendar/EventPill.tsx
src/components/calendar/EventPopover.tsx
src/components/calendar/UpcomingSidebar.tsx
```

Edited: `types/index.ts` (round fields + `MeetPlatform` + `CalendarEvent` + `ViewMode`),
`InterviewRoundsManager.tsx`, `Header.tsx` + `MobileNav.tsx` (Calendar tab), `page.tsx`
(view wiring), `messages/{en,hi}.json` (`nav.calendar`, `calendar.*`, `round.*`, `eventType.*`).

---

## 6. UI/UX SPECIFICATIONS

### Design Language
**Inspired by:** Linear + Vercel + Trello minimal

### Color System

```css
/* ── Dark Mode (default) ─────────────────── */
--bg-primary:     #0F172A;   /* slate-900 */
--bg-secondary:   #1E293B;   /* slate-800 */
--bg-card:        #1E293B;   /* slate-800 */
--bg-hover:       #334155;   /* slate-700 */
--bg-input:       #0F172A;
--border:         #334155;   /* slate-700 */
--text-primary:   #F1F5F9;   /* slate-100 */
--text-secondary: #94A3B8;   /* slate-400 */
--text-muted:     #475569;   /* slate-600 */
--accent:         #6366F1;   /* indigo-500 */
--accent-hover:   #818CF8;   /* indigo-400 */
--success:        #22C55E;   /* green-500 */
--warning:        #F59E0B;   /* amber-500 */
--error:          #EF4444;   /* red-500 */

/* ── Light Mode ──────────────────────────── */
--bg-primary:     #F8FAFC;   /* slate-50 */
--bg-secondary:   #FFFFFF;
--bg-card:        #FFFFFF;
--bg-hover:       #F1F5F9;   /* slate-100 */
--border:         #E2E8F0;   /* slate-200 */
--text-primary:   #0F172A;   /* slate-900 */
--text-secondary: #475569;   /* slate-600 */
--text-muted:     #94A3B8;   /* slate-400 */
--accent:         #4F46E5;   /* indigo-600 */
```

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Mono Font:** JetBrains Mono (for IDs, dates)
- **Hindi Font:** Noto Sans Devanagari
- **Scale:** text-xs / text-sm / text-base / text-lg / text-xl / text-2xl

### Spacing
- Base grid: 4px (Tailwind default)
- Card padding: 16px
- Column gap: 16px
- Section spacing: 24px

### Border Radius
- Cards: `rounded-xl` (12px)
- Modals/Drawers: `rounded-2xl` (16px)
- Badges: `rounded-full`
- Buttons: `rounded-lg` (8px)

### Shadows
```css
--shadow-card:  0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
--shadow-drag:  0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
--shadow-modal: 0 25px 50px rgba(0,0,0,0.5);
```

### Animations (Framer Motion)

| Trigger | Animation |
|---------|-----------|
| Card drag start | scale(1.02) + shadow-drag |
| Card drop | spring back to normal |
| Status → Accepted | Full-screen confetti (canvas-confetti) 🎉 |
| Modal open | fade-in + slide-up (200ms) |
| Drawer open | slide-in from right (250ms) |
| Column collapse | smooth height transition |
| Toast notification | slide-in from top-right |
| Ghost card | subtle floating y-animation |
| Page load | staggered card fade-in |

### shadcn/ui Components Used
Dialog | Sheet | Badge | Progress | Tabs | Popover | Command | Calendar | Toast | Switch | Select | Slider | Tooltip | Alert | Accordion | DropdownMenu | Separator | Avatar | ScrollArea | Skeleton

---

## 7. KANBAN BOARD SPEC

### Header Bar
```
[🎯 JobTracker AI]  [Search...........] [Filters ▼] [⊞ Kanban|≡ Table|📊 Analytics]
                                                      [EN|हिं] [🌙/☀️] [+ Add Job]
```

### Board Container
- `overflow-x: auto` with smooth scroll
- Snap to column on mobile
- Column min-width: 300px, fixed
- Gap between columns: 16px
- Padding: 16px

### Column Structure
```
┌─────────────────────────────────┐
│ 🎯 Interview  साक्षात्कार  [4]  │ ← header (sticky)
│                          [+][–] │
│─────────────────────────────────│
│ [Card]                          │ ← body (scrollable)
│ [Card]                          │
│ [Card]                          │
│ [Card]                          │
│─────────────────────────────────│
│ + Add job here                  │ ← footer ghost CTA
└─────────────────────────────────┘
```

### Scroll Behaviour
- Horizontal: board scrolls left-right
- Vertical: each column scrolls independently
- Keyboard: arrow keys navigate columns when focused

### Mobile Layout (< 768px)
- Single column view (one status column at a time)
- Horizontal swipe to next column
- Column indicator dots at bottom
- Bottom navigation: Board | Analytics | + Add | Settings

### Tablet Layout (768px–1024px)
- 3 columns visible
- Rest accessible via horizontal scroll

---

## 8. AUTH & DATA PERSISTENCE

### Guest Mode (Default)
- Data: `localStorage` key `"jobtracker_v3"`
- Survives browser refresh
- Lost on browser clear / incognito close
- Persistent guest banner: "💾 Guest Mode — Sign in to sync, or Export JSON to backup"
- JSON export always available (one-click in header + settings)

### Linked Disk-Folder Auto-Backup (v3.2)

The shipped app replaces the planned cloud login with a **client-only, no-account** backup
that writes directly to a file on the user's device via the **File System Access API**.

- **Onboarding step 2** (after persona): "Choose a data folder" (suggested under Documents) or
  "Skip — use this browser only".
- On pick, the app reads `jobtracker-backup.json` in that folder if present (**loads** it),
  otherwise **creates** it from current state. Every change then **auto-syncs** (debounced) to
  that file.
- The directory **handle is remembered in IndexedDB** (handles aren't JSON-serializable, so they
  are never put in the `jobtracker_v3` localStorage blob). localStorage remains the always-on
  working cache and source of truth for instant render.
- **On return:** the board renders instantly from localStorage; a one-click *"Resume saving to
  &lt;folder&gt;"* banner re-grants folder permission (a browser-mandated gesture — silent
  re-open is not possible on the web), then reloads the file and resumes auto-sync. If the
  folder/file is gone, the user is treated as new.
- **Browser support:** Chromium only (Chrome / Edge / Opera). Firefox / Safari automatically
  fall back to manual JSON Export / Import. Settings → Data exposes Choose / Change folder,
  Sync now, Load from file, Resume, and Unlink.

### Auth Mode (Google + GitHub via NextAuth.js)

> **Not shipped.** v3.2 is guest-mode only; cloud login + Vercel KV were dropped in favour of
> the linked disk-folder backup above. The original spec is retained below for reference.
- On first login: prompt "Migrate your [N] guest applications to your account?"
- Data: Vercel KV (Redis) — key `user:{userId}:data`
- Cross-device sync
- "Last synced: 5 minutes ago" shown in footer
- Logout: option to keep local copy or clear

### JSON Export / Import

**Export:**
```json
{
  "exportedBy": "JobTracker v3.0",
  "exportedAt": "2025-01-15T10:30:00Z",
  "version": "3.0",
  "totalApplications": 42,
  "userPrefs": { ... },
  "applications": [ /* full JobApplication objects */ ]
}
```

**Import:**
- Drag and drop JSON file OR click to browse
- Preview: "Found 42 applications — Import all? Or merge with existing?"
- Options: Replace All | Merge (skip duplicates by id) | Cancel
- Validation: check version field, show error if incompatible

---

## 9. i18n — ENGLISH + HINDI

**Library:** `next-intl`

**Language Toggle:** `EN | हिं` button in header — saves to `userPrefs.language`

### Translation File Structure
```
/messages/
  en.json
  hi.json
```

### Key Translations
```json
// en.json (sample)
{
  "app": {
    "name": "JobTracker",
    "tagline": "Your Career Command Center"
  },
  "nav": {
    "board": "Board",
    "analytics": "Analytics",
    "settings": "Settings",
    "addJob": "Add Job"
  },
  "status": {
    "wishlist": "Wishlist",
    "applied": "Applied",
    "follow_up": "Follow-up",
    "screening": "Screening",
    "interview": "Interview",
    "assignment": "Assignment",
    "offer": "Offer",
    "negotiating": "Negotiating",
    "accepted": "Accepted",
    "rejected": "Rejected",
    "withdrawn": "Withdrawn",
    "ghosted": "Ghosted"
  },
  "card": {
    "daysAgo": "{n} days ago",
    "followUpOverdue": "Follow-up overdue · {n} days",
    "offerDeadline": "Offer expires in {n} days",
    "interviewTomorrow": "Interview tomorrow"
  },
  "modal": {
    "addJob": "Add Job",
    "editJob": "Edit Job",
    "step1": "Basic Info",
    "step2": "Details",
    "step3": "Contacts & Notes"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "export": "Export JSON",
    "import": "Import JSON",
    "undo": "Undo"
  },
  "empty": {
    "board": "No applications yet. Add your first job!",
    "column": "No cards here. Drag one over or add new."
  },
  "notifications": {
    "followUpDue": "Follow up with {company} today",
    "offerExpiring": "Offer from {company} expires in {n} days",
    "autoGhosted": "{n} applications marked as Ghosted"
  }
}
```

```json
// hi.json (sample)
{
  "app": {
    "name": "जॉब ट्रैकर",
    "tagline": "आपका करियर कमांड सेंटर"
  },
  "nav": {
    "board": "बोर्ड",
    "analytics": "विश्लेषण",
    "settings": "सेटिंग्स",
    "addJob": "नौकरी जोड़ें"
  },
  "status": {
    "wishlist": "इच्छा सूची",
    "applied": "आवेदित",
    "follow_up": "फ़ॉलो-अप",
    "screening": "स्क्रीनिंग",
    "interview": "साक्षात्कार",
    "assignment": "असाइनमेंट",
    "offer": "प्रस्ताव",
    "negotiating": "वार्ता",
    "accepted": "स्वीकृत",
    "rejected": "अस्वीकृत",
    "withdrawn": "वापस लिया",
    "ghosted": "जवाब नहीं"
  },
  "actions": {
    "save": "सेव करें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "export": "JSON निर्यात",
    "import": "JSON आयात"
  }
}
```

---

## 10. PERFORMANCE & ACCESSIBILITY

### Performance
- Next.js App Router — RSC for initial shell
- Lazy load: Analytics tab, Detail Drawer content
- Virtualized list: `react-virtual` for table view with 100+ rows
- Debounced search: 300ms
- Optimistic UI: drag-and-drop instant, localStorage write async
- Company logos: Next.js `<Image>` with `sizes` + `priority` for above-fold
- No AI calls = zero API latency

### Accessibility (WCAG 2.1 AA)
- All interactive elements keyboard navigable
- Visible focus rings
- ARIA labels on all icon buttons
- Screen reader announcements on status changes
- Colour never the sole differentiator (always + icon/text)
- Min touch target: 44×44px (mobile)
- Contrast ratios met in both dark and light themes

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette / search |
| `N` | New job (when not in input) |
| `E` | Edit focused card |
| `Escape` | Close modal / drawer |
| `1–9` | Quick change status (1=Wishlist … 9=Accepted) |
| `Tab` | Navigate cards |
| `Enter` | Open job detail |
| `D` | Delete focused card (with confirmation) |
| `F` | Toggle favourite on focused card |

---

## 11. FILE STRUCTURE

```
job-tracker/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Kanban board (default view)
│   │   ├── analytics/page.tsx          # Analytics dashboard
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── sync/route.ts               # Vercel KV sync (auth users)
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx             # Root board + DnD context
│   │   ├── KanbanColumn.tsx            # Single column
│   │   ├── JobCard.tsx                 # Card component
│   │   ├── JobCardContextMenu.tsx      # ⋮ right-click menu
│   │   ├── DragOverlay.tsx             # Ghost card while dragging
│   │   └── EmptyColumnState.tsx
│   ├── modals/
│   │   ├── AddJobModal.tsx             # 3-step wizard (add + edit)
│   │   ├── JobDetailDrawer.tsx         # Right-side detail panel
│   │   ├── TextViewerModal.tsx         # Read-only JD / Resume text viewer
│   │   ├── ImportExportModal.tsx
│   │   ├── DeleteConfirmDialog.tsx
│   │   └── OnboardingModal.tsx
│   ├── documents/
│   │   ├── DocumentsPanel.tsx          # JD + Resume section in drawer
│   │   ├── FileUploadZone.tsx          # Drag-drop zone + file picker
│   │   ├── DocumentBadge.tsx           # 📄 JD / 📄 CV card badges
│   │   └── TextInputToggle.tsx         # Paste | Upload tab switcher
│   ├── views/
│   │   ├── TableView.tsx               # Spreadsheet view
│   │   └── AnalyticsDashboard.tsx
│   ├── charts/
│   │   ├── StatusDonut.tsx
│   │   ├── TimelineChart.tsx
│   │   ├── SourceBarChart.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   └── ApplicationFunnel.tsx
│   ├── filters/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── FilterChips.tsx
│   │   └── SortDropdown.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationCenter.tsx
│   ├── interviews/
│   │   └── InterviewRoundsManager.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── LangToggle.tsx
│   └── ui/                             # shadcn/ui components
│
├── hooks/
│   ├── useApplications.ts              # Core CRUD + state
│   ├── useLocalStorage.ts              # localStorage read/write
│   ├── useNotifications.ts             # Notification logic
│   ├── useGhostDetector.ts             # Auto-ghost after N days
│   ├── useFilters.ts                   # Filter + sort state
│   └── useKeyboardShortcuts.ts
│
├── lib/
│   ├── storage.ts                      # localStorage abstraction
│   ├── export-import.ts                # JSON export/import logic
│   ├── extract-text.ts                 # PDF + DOCX → plain text (pdfjs-dist + mammoth)
│   ├── notifications.ts                # Browser notification API
│   ├── ghost-detector.ts               # Ghost detection logic
│   ├── clearbit.ts                     # Company logo fetch
│   └── utils.ts                        # Date helpers, UUID, etc.
│
├── types/
│   └── index.ts                        # All TypeScript interfaces
│
├── messages/
│   ├── en.json
│   └── hi.json
│
├── public/
│   ├── icons/
│   │   ├── linkedin.svg
│   │   ├── naukri.svg
│   │   ├── indeed.svg
│   │   ├── unstop.svg
│   │   ├── internshala.svg
│   │   └── ...
│   └── illustrations/
│       ├── empty-board.svg
│       ├── empty-column.svg
│       └── onboarding.svg
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── middleware.ts                        # Auth middleware
└── package.json
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.local

# NextAuth (required for login)
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-app-secret

# Vercel KV — optional, only for cloud sync
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Clearbit Logo API — free, no key needed
# https://logo.clearbit.com/{domain}
# Already works in the client — no env var needed
```

---

## 13. DEPLOYMENT GUIDE (VERCEL)

```bash
# Step 1 — Create project
npx create-next-app@latest job-tracker \
  --typescript --tailwind --app --src-dir

# Step 2 — Install dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install next-auth @auth/core
npm install next-intl
npm install recharts
npm install framer-motion
npm install date-fns
npm install lucide-react
npm install canvas-confetti
npm install @types/canvas-confetti
npm install @vercel/kv
npm install uuid
npm install @types/uuid
npm install pdfjs-dist                 # PDF → text extraction (browser)
npm install mammoth                    # DOCX → text extraction (browser)

# Step 3 — Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button dialog sheet badge progress tabs \
  popover command calendar toast switch select slider tooltip \
  alert accordion dropdown-menu separator avatar scroll-area skeleton

# Step 4 — Add env vars to Vercel dashboard
# Project → Settings → Environment Variables

# Step 5 — Deploy
npx vercel --prod
```

---

## 14. COMPETITION EDGE FEATURES

| # | Feature | Why It Wins |
|---|---------|-------------|
| 🏆 1 | **Confetti on Accepted 🎉** | Emotional delight — judges remember it |
| 🏆 2 | **Ghost Detector 👻** | Unique auto-detection + floating animation |
| 🏆 3 | **12 Status Pipeline** | Most complete pipeline of any tracker |
| 🏆 4 | **Hindi i18n** | Only tracker with native Hindi support |
| 🏆 5 | **Activity Heatmap** | GitHub-style — visually stunning |
| 🏆 6 | **Application Funnel Chart** | Shows conversion at every stage |
| 🏆 7 | **5-Source Icon Badges** | LinkedIn 🔵 Naukri 🔴 — instant visual clarity |
| 🏆 8 | **Offer Deadline Countdown** | "Offer expires in 2 days" — critical UX |
| 🏆 9 | **Resume Version Tag** | "Which version did I use?" — solved |
| 🏆 10 | **Keyboard Shortcuts** | Power user UX (Cmd+K, N, E, 1–9) |
| 🏆 11 | **Priority Left Border** | Gold border for Dream Job — visually distinct |
| 🏆 12 | **Status Timeline in Drawer** | Full history of every status change |
| 🏆 13 | **Bulk Actions in Table View** | Select 10 → change status in one click |
| 🏆 14 | **Saved Filter Presets** | "Active High Priority" — one click |
| 🏆 15 | **Undo Drag Toast** | "Moved to Interview. Undo?" — prevents mistakes |
| 🏆 16 | **JD + Resume per card** | Paste or upload PDF/DOCX — text stored in JSON, works offline |
| 🏆 17 | **Document badges on card** | 📄 JD ✅ · 📄 CV ✅ — at-a-glance completeness |
| 🏆 18 | **Calendar (Month + Week)** | Live current-time line, timed interview blocks, upcoming rail — derived, zero extra storage |
| 🏆 19 | **Linked disk-folder auto-backup** | Your data saved to a real `.json` on your device, no account — privacy-first, survives browser clears |

---

## 15. CLAUDE CODE STARTER PROMPT

**Copy this exactly when handing to Claude Code:**

```
You are building "JobTracker" — a world-class job application tracker for a student competition.
Read every section of the PRD before writing a single line of code.

IMPORTANT: This app has ZERO AI features. No Anthropic API. No LLM calls. Pure tracker.

TECH STACK:
- Next.js 14 App Router (TypeScript)
- Tailwind CSS + shadcn/ui
- @dnd-kit for drag-and-drop Kanban
- Recharts for analytics
- NextAuth.js (Google + GitHub)
- Vercel KV (cloud sync for auth users)
- localStorage (guest mode)
- next-intl (English + Hindi)
- Framer Motion (animations)
- canvas-confetti (Accepted status celebration)

BUILD IN THIS ORDER:

PHASE 1 — Foundation:
1. npx create-next-app + install all deps from Section 13
2. All TypeScript interfaces from Section 3 → /types/index.ts
3. localStorage service → /lib/storage.ts
4. Dark/Light theme (CSS variables from Section 6)
5. next-intl setup with en.json + hi.json from Section 9
6. Header component (logo + search + view toggle + lang + theme + add button)

PHASE 2 — Core Kanban:
7. KanbanBoard with @dnd-kit DndContext + SortableContext
8. KanbanColumn (12 columns, all 12 statuses from Section 4)
9. JobCard with ALL fields from Section F2 card design
10. Card drag-and-drop between columns → auto status update + statusHistory append
11. Undo toast on drag (5 second window)
12. Empty column state with illustration
13. Column collapse/expand

PHASE 3 — Modals:
14. AddJobModal — 3-step wizard from Section F3
15. JobDetailDrawer — right Sheet panel from Section F4
16. DeleteConfirmDialog
17. OnboardingModal (persona selection: Student / Professional)

PHASE 4 — Views & Filters:
18. TableView with sortable columns + bulk actions
19. SearchBar with 300ms debounce
20. FilterPanel (all filter types from Section F8)
21. FilterChips (active filters shown below search)
22. SortDropdown
23. Saved Filter Presets

PHASE 5 — Analytics:
24. AnalyticsDashboard with KPI strip
25. StatusDonut (Recharts)
26. TimelineChart (30/60/90d toggle)
27. SourceBarChart
28. ActivityHeatmap (GitHub-style calendar)
29. ApplicationFunnel

PHASE 6 — Notifications:
30. Ghost detector hook (auto-mark ghosted after N days on app load)
31. NotificationBell + NotificationCenter
32. Browser notifications (with permission request)
33. Offer deadline countdown alerts

PHASE 7 — Polish:
34. Interview Rounds Manager (in Detail Drawer)
35. JSON export / import (from Section 8)
36. Auth (NextAuth Google + GitHub)
37. Vercel KV sync for auth users
38. Confetti on Accepted status (canvas-confetti)
39. Keyboard shortcuts (Section 10 table)
40. Framer Motion animations (Section 6 animation table)
41. Mobile responsive layout + MobileNav
42. Vercel deploy

CRITICAL RULES:
- localStorage key: "jobtracker_v3"
- Every status change MUST append to statusHistory[]
- lastActivityDate MUST update on every card change
- Ghost detection: run on app load, check lastActivityDate > ghostThresholdDays
- Confetti ONLY on transition TO "accepted" status
- Company logo: fetch from https://logo.clearbit.com/{domain} — fallback to colored initials avatar
- All 12 statuses must exist as columns from day 1
- Hindi translations required for ALL user-visible strings
- Follow exact color palette from Section 6
- Follow exact file structure from Section 11
- NO AI, NO Anthropic SDK, NO external AI API calls

JD + RESUME STORAGE RULES (Section F11):
- NEVER store raw PDF/DOCX binary in localStorage — only extracted plain text
- Use pdfjs-dist for PDF extraction (browser, no server)
- Use mammoth for DOCX extraction (browser, no server)
- All extraction logic lives in lib/extract-text.ts
- Fields per card: jdText, jdFileName, jdSource, jdAddedAt, resumeText, resumeFileName, resumeVersion, resumeSource, resumeAddedAt
- Both JD and Resume are optional — cards work fine without them
- 1 JD + 1 Resume max per card — replacing shows confirmation dialog
- Show document badges on Kanban card: 📄 JD (teal filled) vs ○ JD (outline) based on !!jdText
- Allowed file types: .pdf, .docx only — validate before extraction
- Max file size: 5 MB per file — validate before extraction
- If extracted text < 50 words: warn "This seems short — was the file scanned?"
- If extraction fails: show error and prompt user to paste text manually
- Search bar (F8) must also search inside jdText and resumeText
- Filter panel (F8) must include "Has JD" / "Has Resume" / "Missing Documents" toggles
```

---

## 16. IMPLEMENTATION NOTES & CHANGELOG (v3.1 → v3.2)

The shipped app realises the v3.1 spec with a few deliberate, documented deviations (the
README is the canonical list). This section records what was actually built so the PRD and
code stay in sync.

### Intentional deviations from the v3.1 stack

| Area | Spec said | Shipped | Why |
|------|-----------|---------|-----|
| i18n | `next-intl` | Custom `useT()` + `messages/{en,hi}.json` (dotted lookup + `{var}`) | Zero deps, full control, no route-based locale needed for a single-page app |
| UI kit | shadcn/ui | Hand-built Tailwind primitives (`components/ui/*`) | Smaller bundle, bespoke look, no generator coupling |
| Routing | `(dashboard)` routes (`/analytics`, `/settings`, `/calendar`) | Single-page client shell; views switch via `ViewMode` state in `page.tsx` | App is fully client-side; no server routes/RSC needed |
| Auth / cloud | NextAuth (Google/GitHub) + Vercel KV sync | **Dropped** — guest-mode only | Privacy-first, no secrets/backend; replaced by the linked disk-folder backup |
| Data backup | JSON export/import only | **+ Linked disk-folder auto-backup** (File System Access API, IndexedDB handle) | Direct on-device persistence without an account (see §8) |

### v3.2 — Additions

- **Calendar view (F12):** Month + Week, derived events, expanded interview-round fields,
  upcoming rail, filters, event popovers, browser reminders, live current-time line.
- **Linked disk-folder auto-backup (§8):** onboarding folder pick → auto-sync to
  `jobtracker-backup.json`, IndexedDB-remembered handle, one-click resume, Chromium-only with
  graceful Export/Import fallback.
- **Onboarding** is now a 2-step wizard (persona → data-folder choice).
- **Guest footer** reworded to state browser-support split; no duplicate backup messaging.

### Data-contract guarantees (unchanged)

- localStorage key stays `jobtracker_v3`; export `version` stays `3.0`.
- All new `InterviewRound` fields are optional → older exports import cleanly.
- `CalendarEvent` is computed, never stored.

---

*PRD v3.2 — No AI Edition — Competition Ready*
*Tailor → Apply → Track → Win 🚀*