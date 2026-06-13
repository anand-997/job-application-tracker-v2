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

export interface InterviewRound {
  id: string;
  roundNumber: number;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'hr' | 'assignment' | 'final';
  scheduledDate?: string;
  completedDate?: string;
  interviewer?: string;
  notes?: string;
  outcome?: 'passed' | 'failed' | 'pending' | 'cancelled';
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

export type ViewMode = 'kanban' | 'table' | 'analytics';

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
