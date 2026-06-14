'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import type {
  AppState, JobApplication, UserPrefs, StatusValue, SavedFilter,
  FilterState, InterviewRound, AppNotification,
} from '@/types';
import { loadState, saveState, emptyState, clearState } from '@/lib/storage';
import { detectGhosts } from '@/lib/ghost-detector';
import { buildNotifications, ghostNotification, fireBrowserNotification } from '@/lib/notifications';
import { buildSampleApplications } from '@/lib/sample-data';
import { mergeApplications, buildExport, parseImport } from '@/lib/export-import';
import {
  fsaSupported, pickBackupFile, writeFile as fsWriteFile, readFile as fsReadFile,
  verifyPermission, saveHandle, loadHandle, clearHandle, type BackupHandle,
} from '@/lib/file-sync';
import { uuid, nowISO } from '@/lib/utils';

export type BackupStatus = 'unsupported' | 'unlinked' | 'needs-permission' | 'linked';

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  notifications: AppNotification[];
  unreadCount: number;

  // applications
  addApplication: (app: JobApplication) => void;
  updateApplication: (app: JobApplication) => void;
  deleteApplication: (id: string) => void;
  duplicateApplication: (id: string) => void;
  changeStatus: (id: string, status: StatusValue, changedBy?: 'user' | 'auto_ghost') => void;
  toggleFavorite: (id: string) => void;

  // interview rounds
  addRound: (jobId: string, round?: Partial<InterviewRound>) => void;
  updateRound: (jobId: string, round: InterviewRound) => void;
  deleteRound: (jobId: string, roundId: string) => void;

  // prefs
  setPrefs: (patch: Partial<UserPrefs>) => void;

  // filters presets
  savePreset: (name: string, filters: FilterState) => void;
  deletePreset: (id: string) => void;

  // data ops
  importApplications: (apps: JobApplication[], mode: 'replace' | 'merge', prefs?: UserPrefs) => number;
  loadSample: () => void;
  clearAll: () => void;

  // disk backup file (File System Access API; Chromium-only)
  backupStatus: BackupStatus;
  backupFileName: string | null;
  lastSyncedAt: string | null;
  linkBackupFile: () => Promise<boolean>;
  reconnectBackup: () => Promise<boolean>;
  syncBackupNow: () => Promise<boolean>;
  importFromBackup: (mode?: 'replace' | 'merge') => Promise<number | null>;
  unlinkBackup: () => void;

  // notifications
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const prevAcceptedRef = useRef<Set<string>>(new Set());

  // Latest state for async file-write callbacks (avoids stale closures).
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Disk backup file (File System Access API) ──
  const [backupHandle, setBackupHandle] = useState<BackupHandle | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('unlinked');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate from localStorage + run ghost detection (PRD §F9/§F10) ──
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      const { apps, ghostedIds } = detectGhosts(loaded.applications, loaded.userPrefs.ghostThresholdDays);
      const next = { ...loaded, applications: apps };
      setState(next);
      prevAcceptedRef.current = new Set(apps.filter((a) => a.status === 'accepted').map((a) => a.id));
      if (ghostedIds.length > 0) {
        // surfaced via notifications list automatically; also push an aggregate toast-like notif
        setReadIds((prev) => prev);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist on change (localStorage stays the primary source of truth) ──
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // ── Detect / restore a linked backup file on mount ──
  useEffect(() => {
    if (!fsaSupported()) {
      setBackupStatus('unsupported');
      return;
    }
    loadHandle()
      .then((h) => {
        // A handle is remembered but the browser needs a gesture to re-grant
        // access, so we surface a one-click "Reconnect" rather than writing now.
        if (h) {
          setBackupHandle(h);
          setBackupStatus('needs-permission');
        }
      })
      .catch(() => { /* ignore — stays 'unlinked' */ });
  }, []);

  // ── Auto-sync to the linked file (debounced) whenever state changes ──
  useEffect(() => {
    if (!hydrated || backupStatus !== 'linked' || !backupHandle) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fsWriteFile(backupHandle, buildExport(stateRef.current))
        .then(() => setLastSyncedAt(nowISO()))
        .catch(() => setBackupStatus('needs-permission')); // permission revoked / file moved
    }, 800);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state, hydrated, backupStatus, backupHandle]);

  // ── Apply theme + language to <html> ──
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', state.userPrefs.theme === 'dark');
    root.classList.toggle('light', state.userPrefs.theme === 'light');
    root.setAttribute('lang', state.userPrefs.language);
  }, [state.userPrefs.theme, state.userPrefs.language]);

  // ── Derived notifications ──
  const ghostNotif = useMemo(() => {
    if (!hydrated) return null;
    const ghosts = state.applications.filter((a) => a.status === 'ghosted');
    return ghosts.length > 0 ? ghostNotification(ghosts.length) : null;
  }, [state.applications, hydrated]);

  const notifications = useMemo(() => {
    const list = buildNotifications(state.applications);
    if (ghostNotif) list.unshift(ghostNotif);
    return list.map((n) => ({ ...n, read: readIds.has(n.id) }));
  }, [state.applications, ghostNotif, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Helpers ──
  const setApps = useCallback((updater: (apps: JobApplication[]) => JobApplication[]) => {
    setState((prev) => ({ ...prev, applications: updater(prev.applications) }));
  }, []);

  const fireConfettiIfAccepted = useCallback((id: string, status: StatusValue) => {
    if (status === 'accepted' && !prevAcceptedRef.current.has(id)) {
      prevAcceptedRef.current.add(id);
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.2, y: 0.5 } }), 200);
        setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.8, y: 0.5 } }), 350);
      });
    }
    if (status !== 'accepted') prevAcceptedRef.current.delete(id);
  }, []);

  // ── Applications CRUD ──
  const addApplication = useCallback((app: JobApplication) => {
    // Adding a real application means the user has "adopted" the board — drop the sample flag.
    setState((prev) => ({
      ...prev,
      applications: [app, ...prev.applications],
      userPrefs: prev.userPrefs.sampleLoaded ? { ...prev.userPrefs, sampleLoaded: false } : prev.userPrefs,
    }));
    fireConfettiIfAccepted(app.id, app.status);
  }, [fireConfettiIfAccepted]);

  const updateApplication = useCallback((app: JobApplication) => {
    const updated = { ...app, lastActivityDate: nowISO(), updatedAt: nowISO() };
    setApps((apps) => apps.map((a) => (a.id === app.id ? updated : a)));
    fireConfettiIfAccepted(app.id, app.status);
  }, [setApps, fireConfettiIfAccepted]);

  const deleteApplication = useCallback((id: string) => {
    setApps((apps) => apps.filter((a) => a.id !== id));
  }, [setApps]);

  const duplicateApplication = useCallback((id: string) => {
    setApps((apps) => {
      const src = apps.find((a) => a.id === id);
      if (!src) return apps;
      const ts = nowISO();
      const copy: JobApplication = {
        ...src,
        id: uuid(),
        company: `${src.company} (copy)`,
        isFavorite: false,
        createdAt: ts,
        updatedAt: ts,
        lastActivityDate: ts,
        statusHistory: [{ status: src.status, timestamp: ts, changedBy: 'user' }],
        interviewRounds: src.interviewRounds.map((r) => ({ ...r, id: uuid() })),
      };
      return [copy, ...apps];
    });
  }, [setApps]);

  const changeStatus = useCallback(
    (id: string, status: StatusValue, changedBy: 'user' | 'auto_ghost' = 'user') => {
      const ts = nowISO();
      setApps((apps) =>
        apps.map((a) => {
          if (a.id !== id || a.status === status) return a;
          return {
            ...a,
            status,
            lastActivityDate: ts,
            updatedAt: ts,
            statusHistory: [...a.statusHistory, { status, timestamp: ts, changedBy }],
          };
        }),
      );
      fireConfettiIfAccepted(id, status);
    },
    [setApps, fireConfettiIfAccepted],
  );

  const toggleFavorite = useCallback((id: string) => {
    setApps((apps) => apps.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite, updatedAt: nowISO() } : a)));
  }, [setApps]);

  // ── Interview rounds ──
  const addRound = useCallback((jobId: string, round?: Partial<InterviewRound>) => {
    setApps((apps) =>
      apps.map((a) => {
        if (a.id !== jobId) return a;
        const roundNumber = a.interviewRounds.length + 1;
        const newRound: InterviewRound = {
          id: uuid(),
          roundNumber,
          type: 'technical',
          outcome: 'pending',
          ...round,
        };
        return { ...a, interviewRounds: [...a.interviewRounds, newRound], updatedAt: nowISO(), lastActivityDate: nowISO() };
      }),
    );
  }, [setApps]);

  const updateRound = useCallback((jobId: string, round: InterviewRound) => {
    setApps((apps) =>
      apps.map((a) =>
        a.id === jobId
          ? { ...a, interviewRounds: a.interviewRounds.map((r) => (r.id === round.id ? round : r)), updatedAt: nowISO() }
          : a,
      ),
    );
  }, [setApps]);

  const deleteRound = useCallback((jobId: string, roundId: string) => {
    setApps((apps) =>
      apps.map((a) =>
        a.id === jobId
          ? { ...a, interviewRounds: a.interviewRounds.filter((r) => r.id !== roundId) }
          : a,
      ),
    );
  }, [setApps]);

  // ── Prefs ──
  const setPrefs = useCallback((patch: Partial<UserPrefs>) => {
    setState((prev) => ({ ...prev, userPrefs: { ...prev.userPrefs, ...patch } }));
  }, []);

  // ── Presets ──
  const savePreset = useCallback((name: string, filters: FilterState) => {
    const preset: SavedFilter = { id: uuid(), name, filters };
    setState((prev) => ({ ...prev, savedFilters: [...prev.savedFilters, preset] }));
  }, []);

  const deletePreset = useCallback((id: string) => {
    setState((prev) => ({ ...prev, savedFilters: prev.savedFilters.filter((p) => p.id !== id) }));
  }, []);

  // ── Data ops ──
  const importApplications = useCallback(
    (apps: JobApplication[], mode: 'replace' | 'merge', prefs?: UserPrefs) => {
      let count = 0;
      setState((prev) => {
        const applications = mode === 'replace' ? apps : mergeApplications(prev.applications, apps);
        count = mode === 'replace' ? apps.length : applications.length - prev.applications.length;
        // Replacing with the user's own data clears the sample flag.
        const sampleLoaded = mode === 'replace' ? false : prev.userPrefs.sampleLoaded;
        return {
          ...prev,
          applications,
          userPrefs: prefs
            ? { ...prev.userPrefs, ...prefs, onboarded: true, sampleLoaded }
            : { ...prev.userPrefs, sampleLoaded },
        };
      });
      return count;
    },
    [],
  );

  const loadSample = useCallback(() => {
    setState((prev) => ({
      ...prev,
      applications: buildSampleApplications(),
      userPrefs: { ...prev.userPrefs, onboarded: true, sampleLoaded: true },
    }));
  }, []);

  const clearAll = useCallback(() => {
    clearState();
    setState((prev) => ({ ...emptyState(), userPrefs: { ...prev.userPrefs, sampleLoaded: false } }));
    prevAcceptedRef.current = new Set();
  }, []);

  // ── Backup file ops ──
  // Pick (or change) the linked file, write current data, and remember the handle.
  const linkBackupFile = useCallback(async () => {
    let handle: BackupHandle;
    try {
      handle = await pickBackupFile();
    } catch {
      return false; // user cancelled the picker
    }
    await fsWriteFile(handle, buildExport(stateRef.current));
    await saveHandle(handle);
    setBackupHandle(handle);
    setBackupStatus('linked');
    setLastSyncedAt(nowISO());
    return true;
  }, []);

  // Re-grant access to a remembered handle (post-reload), then resume syncing.
  const reconnectBackup = useCallback(async () => {
    if (!backupHandle) return false;
    if (!(await verifyPermission(backupHandle, true))) return false;
    await fsWriteFile(backupHandle, buildExport(stateRef.current));
    setBackupStatus('linked');
    setLastSyncedAt(nowISO());
    return true;
  }, [backupHandle]);

  const syncBackupNow = useCallback(async () => {
    if (!backupHandle) return false;
    if (!(await verifyPermission(backupHandle, true))) {
      setBackupStatus('needs-permission');
      return false;
    }
    await fsWriteFile(backupHandle, buildExport(stateRef.current));
    setBackupStatus('linked');
    setLastSyncedAt(nowISO());
    return true;
  }, [backupHandle]);

  // Load the linked file back into the app (file is the authoritative backup → replace by default).
  const importFromBackup = useCallback(async (mode: 'replace' | 'merge' = 'replace') => {
    if (!backupHandle) return null;
    if (!(await verifyPermission(backupHandle, false))) {
      setBackupStatus('needs-permission');
      return null;
    }
    const text = await fsReadFile(backupHandle);
    const parsed = parseImport(text);
    const count = importApplications(parsed.applications, mode, parsed.userPrefs);
    setBackupStatus('linked');
    return count;
  }, [backupHandle, importApplications]);

  const unlinkBackup = useCallback(() => {
    void clearHandle();
    setBackupHandle(null);
    setLastSyncedAt(null);
    setBackupStatus(fsaSupported() ? 'unlinked' : 'unsupported');
  }, []);

  // ── Notifications ──
  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  // Fire a browser notification for newly-detected urgent items (once granted).
  const firedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!hydrated) return;
    for (const n of notifications) {
      if (n.read || firedRef.current.has(n.id)) continue;
      if (n.type === 'offerDeadline' || n.type === 'followUpOverdue' || n.type === 'interviewTomorrow') {
        firedRef.current.add(n.id);
        fireBrowserNotification('JobTracker', notifText(n));
      }
    }
  }, [notifications, hydrated]);

  const value: AppContextValue = {
    state, hydrated, notifications, unreadCount,
    addApplication, updateApplication, deleteApplication, duplicateApplication,
    changeStatus, toggleFavorite,
    addRound, updateRound, deleteRound,
    setPrefs, savePreset, deletePreset,
    importApplications, loadSample, clearAll,
    backupStatus, backupFileName: backupHandle?.name ?? null, lastSyncedAt,
    linkBackupFile, reconnectBackup, syncBackupNow, importFromBackup, unlinkBackup,
    markAllRead, dismissNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function notifText(n: AppNotification): string {
  switch (n.type) {
    case 'offerDeadline': return `Offer from ${n.company} expires in ${n.days} days`;
    case 'followUpOverdue': return `Follow-up overdue — ${n.company} · ${n.days} days`;
    case 'interviewTomorrow': return `Interview at ${n.company} tomorrow`;
    default: return 'You have new updates.';
  }
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
