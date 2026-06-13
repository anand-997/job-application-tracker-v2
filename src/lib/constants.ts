import type {
  SourceValue, StatusValue, JobType, Priority, WorkMode,
} from '@/types';

// ── Status config (PRD §4 reference table) ────────────────────
export const STATUS_ORDER: StatusValue[] = [
  'wishlist', 'applied', 'follow_up', 'screening',
  'interview', 'assignment', 'offer', 'negotiating',
  'accepted', 'rejected', 'withdrawn', 'ghosted',
];

export const STATUS_CONFIG: Record<StatusValue, { color: string; icon: string }> = {
  wishlist:    { color: '#6366F1', icon: '💭' },
  applied:     { color: '#3B82F6', icon: '📤' },
  follow_up:   { color: '#F59E0B', icon: '📬' },
  screening:   { color: '#8B5CF6', icon: '📞' },
  interview:   { color: '#EC4899', icon: '🎯' },
  assignment:  { color: '#14B8A6', icon: '📝' },
  offer:       { color: '#10B981', icon: '💰' },
  negotiating: { color: '#F97316', icon: '🤝' },
  accepted:    { color: '#22C55E', icon: '🎉' },
  rejected:    { color: '#EF4444', icon: '❌' },
  withdrawn:   { color: '#6B7280', icon: '🚪' },
  ghosted:     { color: '#374151', icon: '👻' },
};

// Bilingual labels for column dual-display (PRD §F1: EN name + HI name below)
export const STATUS_LABELS: Record<StatusValue, { en: string; hi: string }> = {
  wishlist:    { en: 'Wishlist',    hi: 'इच्छा सूची' },
  applied:     { en: 'Applied',     hi: 'आवेदित' },
  follow_up:   { en: 'Follow-up',   hi: 'फ़ॉलो-अप' },
  screening:   { en: 'Screening',   hi: 'स्क्रीनिंग' },
  interview:   { en: 'Interview',   hi: 'साक्षात्कार' },
  assignment:  { en: 'Assignment',  hi: 'असाइनमेंट' },
  offer:       { en: 'Offer',       hi: 'प्रस्ताव' },
  negotiating: { en: 'Negotiating', hi: 'वार्ता' },
  accepted:    { en: 'Accepted',    hi: 'स्वीकृत' },
  rejected:    { en: 'Rejected',    hi: 'अस्वीकृत' },
  withdrawn:   { en: 'Withdrawn',   hi: 'वापस लिया' },
  ghosted:     { en: 'Ghosted',     hi: 'जवाब नहीं' },
};

// Quick-status keys 1–9 (PRD §10): 1=Wishlist … 9=Accepted
export const QUICK_STATUS_BY_NUMBER: StatusValue[] = [
  'wishlist', 'applied', 'follow_up', 'screening',
  'interview', 'assignment', 'offer', 'negotiating', 'accepted',
];

// ── Source config (PRD §3 SOURCE_CONFIG) ──────────────────────
export const SOURCE_CONFIG: Record<SourceValue, { label: string; color: string; icon: string }> = {
  linkedin:       { label: 'LinkedIn',       color: '#0077B5', icon: '🔵' },
  naukri:         { label: 'Naukri',         color: '#EF4444', icon: '🔴' },
  indeed:         { label: 'Indeed',         color: '#2164F3', icon: '🔷' },
  unstop:         { label: 'Unstop',         color: '#8B5CF6', icon: '🟣' },
  internshala:    { label: 'Internshala',    color: '#10B981', icon: '🟢' },
  glassdoor:      { label: 'Glassdoor',      color: '#0CAA41', icon: '🪞' },
  angellist:      { label: 'AngelList',      color: '#111827', icon: '⚫' },
  company_portal: { label: 'Company Portal', color: '#F59E0B', icon: '🏢' },
  referral:       { label: 'Referral',       color: '#EC4899', icon: '🤝' },
  other:          { label: 'Other',          color: '#6B7280', icon: '🌐' },
};

export const SOURCE_ORDER: SourceValue[] = [
  'linkedin', 'naukri', 'indeed', 'unstop', 'internshala',
  'glassdoor', 'angellist', 'company_portal', 'referral', 'other',
];

// ── Job type ─────────────────────────────────────────────────
export const JOB_TYPE_ORDER: JobType[] = [
  'fulltime', 'parttime', 'contract', 'internship', 'freelance',
];

// ── Work mode ────────────────────────────────────────────────
export const WORK_MODE_ORDER: WorkMode[] = ['remote', 'hybrid', 'onsite'];

// ── Priority (left-border colors, PRD §F2) ───────────────────
export const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high', 'dream'];

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  low:    { color: '#64748B', label: 'Low' },
  medium: { color: '#3B82F6', label: 'Medium' },
  high:   { color: '#F97316', label: 'High' },
  dream:  { color: '#F5B301', label: 'Dream' },
};

export const CARD_COLORS = [
  '', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#06B6D4',
];

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
};

export const STORAGE_KEY = 'jobtracker_v3';
