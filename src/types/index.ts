// ───────────────────────────────────────────────────────────
// JobTracker — Core Data Model (PRD §3, exact field names)
// ───────────────────────────────────────────────────────────

export type SourceValue =
  | 'linkedin' | 'naukri' | 'indeed' | 'unstop'
  | 'internshala' | 'glassdoor' | 'angellist'
  | 'company_portal' | 'referral' | 'other';

export type StatusValue =
  | 'wishlist' | 'applied' | 'follow_up' | 'screening'
  | 'interview' | 'assignment' | 'offer' | 'negotiating'
  | 'accepted' | 'rejected' | 'withdrawn' | 'ghosted';

export type JobType =
  | 'fulltime' | 'parttime' | 'contract'
  | 'internship' | 'freelance';

export type Priority = 'low' | 'medium' | 'high' | 'dream';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';
export type SalaryType = 'annual' | 'monthly';

export type MeetPlatform =
  | 'google_meet' | 'zoom' | 'teams' | 'phone' | 'in_person' | 'other';

export interface InterviewRound {
  id: string;
  roundNumber: number;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'hr' | 'assignment' | 'final';
  scheduledDate?: string;
  completedDate?: string;
  interviewer?: string;
  notes?: string;
  outcome?: 'passed' | 'failed' | 'pending' | 'cancelled';

  // ── Calendar addon (all optional — backward compatible) ──
  scheduledTime?: string;        // "14:30" — 24h HH:mm
  durationMinutes?: number;      // 30 | 45 | 60 | 90 | 120 — default 60
  timezone?: string;             // e.g. "Asia/Kolkata"
  meetLink?: string;             // Google Meet / Zoom / Teams URL
  meetPlatform?: MeetPlatform;
  location?: string;             // office address — shown when onsite / in_person
  interviewerEmail?: string;
  preparationNotes?: string;
  reminderMinutes?: number;      // browser notification before event: 15|30|60|1440
}

// Computed at render time from applications[] — NEVER stored in AppState/localStorage.
export type CalendarEventType =
  | 'interview_round'
  | 'follow_up'
  | 'offer_deadline'
  | 'applied'
  | 'offer_received'
  | 'interview_scheduled';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;

  title: string;
  subtitle?: string;
  color: string;
  colorLabel: string;

  date: string;                  // "YYYY-MM-DD"
  time?: string;                 // "14:30" — undefined = all-day
  endTime?: string;
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

export interface StatusHistoryEntry {
  status: StatusValue;
  timestamp: string;
  note?: string;
  changedBy: 'user' | 'auto_ghost';
}

export interface JobApplication {
  id: string;

  // Core Info
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  source: SourceValue;
  sourceCustom?: string;

  // Status
  status: StatusValue;
  statusHistory: StatusHistoryEntry[];

  // Dates
  appliedDate: string;
  followUpDate?: string;
  interviewDate?: string;
  offerDate?: string;
  responseDeadline?: string;
  lastActivityDate: string;

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: Currency;
  salaryType: SalaryType;
  offerAmount?: number;

  // Job Details
  jobType: JobType;
  workMode: WorkMode;
  experienceRequired?: string;
  skills: string[];

  // Job Description (1 per card)
  jdText?: string;
  jdFileName?: string;
  jdSource?: 'paste' | 'upload';
  jdAddedAt?: string;

  // Resume (1 per card)
  resumeText?: string;
  resumeFileName?: string;
  resumeVersion?: string;
  resumeSource?: 'paste' | 'upload';
  resumeAddedAt?: string;

  // Contacts
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  hiringManagerName?: string;
  referralName?: string;

  // Notes & Meta
  notes: string;
  tags: string[];
  priority: Priority;
  isFavorite: boolean;
  cardColor?: string;

  // Interview Rounds
  interviewRounds: InterviewRound[];

  // Rejection
  rejectionReason?: string;
  rejectionFeedback?: string;

  // ATS (PRD §F3 step 2)
  atsPlatform?: string;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface UserPrefs {
  theme: 'dark' | 'light';
  language: 'en' | 'hi';
  persona: 'student' | 'professional';
  currency: Currency;
  ghostThresholdDays: number;
  defaultWorkMode?: WorkMode;
  name?: string;
  noticePeriodDays?: number;
  onboarded?: boolean;
  sampleLoaded?: boolean;
}

export interface FilterState {
  status?: StatusValue[];
  source?: SourceValue[];
  priority?: string[];
  workMode?: string[];
  jobType?: string[];
  dateRange?: { from: string; to: string };
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  hasJD?: boolean;
  hasResume?: boolean;
  missingDocs?: boolean;
  followUpOverdue?: boolean;
  offerDeadlineSoon?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

export interface AppState {
  version: '3.0';
  userPrefs: UserPrefs;
  applications: JobApplication[];
  savedFilters: SavedFilter[];
  lastExported?: string;
}

export type SortKey =
  | 'newest' | 'oldest' | 'company' | 'priority'
  | 'daysSince' | 'salary';

export type ViewMode = 'kanban' | 'table' | 'analytics' | 'calendar';

export interface AppNotification {
  id: string;
  type:
    | 'followUpDue' | 'followUpOverdue' | 'offerDeadline'
    | 'offerExpired' | 'autoGhosted' | 'interviewTomorrow';
  jobId?: string;
  company?: string;
  days?: number;
  count?: number;
  read: boolean;
  createdAt: string;
}
