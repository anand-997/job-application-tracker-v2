import { uuid, nowISO, todayISODate } from './utils';
import type { JobApplication, UserPrefs } from '@/types';

export function blankApplication(prefs?: UserPrefs): JobApplication {
  const now = nowISO();
  return {
    id: uuid(),
    company: '',
    role: '',
    location: '',
    jobUrl: '',
    source: 'linkedin',
    status: 'applied',
    statusHistory: [{ status: 'applied', timestamp: now, changedBy: 'user' }],
    appliedDate: todayISODate(),
    lastActivityDate: now,
    salaryCurrency: prefs?.currency ?? 'INR',
    salaryType: 'annual',
    jobType: 'fulltime',
    workMode: prefs?.defaultWorkMode ?? 'remote',
    skills: [],
    notes: '',
    tags: [],
    priority: 'medium',
    isFavorite: false,
    interviewRounds: [],
    createdAt: now,
    updatedAt: now,
  };
}
