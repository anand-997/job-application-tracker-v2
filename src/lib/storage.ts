import { STORAGE_KEY } from './constants';
import type { AppState, UserPrefs } from '@/types';

export const DEFAULT_PREFS: UserPrefs = {
  theme: 'dark',
  language: 'en',
  persona: 'student',
  currency: 'INR',
  ghostThresholdDays: 30,
  defaultWorkMode: 'remote',
  noticePeriodDays: 30,
  onboarded: false,
};

export function emptyState(): AppState {
  return {
    version: '3.0',
    userPrefs: { ...DEFAULT_PREFS },
    applications: [],
    savedFilters: [],
  };
}

export function loadState(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...emptyState(),
      ...parsed,
      userPrefs: { ...DEFAULT_PREFS, ...parsed.userPrefs },
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      savedFilters: Array.isArray(parsed.savedFilters) ? parsed.savedFilters : [],
    };
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // localStorage quota exceeded — surface a console warning (PRD §F11 size budget keeps us safe).
    console.warn('Failed to persist JobTracker state:', err);
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
