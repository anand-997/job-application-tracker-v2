// Browser-only File System Access API helpers + IndexedDB handle persistence.
// Lets the user link a real .json file on disk as a live backup. This API is
// Chromium-only (Chrome/Edge/Opera) — callers MUST check `fsaSupported()` and
// fall back to download/upload (see lib/utils `downloadJSON` + ImportExportModal)
// on Firefox/Safari. Handles are NOT JSON-serializable, so they live in
// IndexedDB rather than the `jobtracker_v3` localStorage blob.

type FsPermissionState = 'granted' | 'denied' | 'prompt';

// Minimal local typing for the File System Access API (not in this project's
// TS lib target). We only declare the bits we use; the real objects come from
// the picker, so casts via `unknown` are safe here.
export interface BackupHandle {
  readonly name: string;
  readonly kind: 'file';
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  getFile: () => Promise<File>;
  queryPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<FsPermissionState>;
  requestPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<FsPermissionState>;
}

interface FsaWindow {
  showSaveFilePicker: (opts?: unknown) => Promise<BackupHandle>;
  showOpenFilePicker: (opts?: unknown) => Promise<BackupHandle[]>;
}

const PICKER_TYPES = [{ description: 'JobTracker backup', accept: { 'application/json': ['.json'] } }];

export function fsaSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

// First-time pick (or "Change file…"): a Save dialog opening under the user's
// Documents folder. Throws AbortError if the user cancels — callers catch it.
export async function pickBackupFile(): Promise<BackupHandle> {
  const w = window as unknown as FsaWindow;
  return w.showSaveFilePicker({
    suggestedName: 'jobtracker-backup.json',
    startIn: 'documents',
    types: PICKER_TYPES,
  });
}

// Re-link an existing backup file (Open dialog).
export async function pickOpenFile(): Promise<BackupHandle> {
  const w = window as unknown as FsaWindow;
  const [handle] = await w.showOpenFilePicker({ startIn: 'documents', types: PICKER_TYPES, multiple: false });
  return handle;
}

export async function writeFile(handle: BackupHandle, data: unknown): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function readFile(handle: BackupHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

// Browsers require a user gesture to (re-)grant access to a remembered handle.
export async function verifyPermission(handle: BackupHandle, readWrite: boolean): Promise<boolean> {
  const mode = readWrite ? 'readwrite' : 'read';
  if ((await handle.queryPermission({ mode })) === 'granted') return true;
  return (await handle.requestPermission({ mode })) === 'granted';
}

// ── IndexedDB handle store ── (the handle survives reloads so we can auto-reconnect)
const DB_NAME = 'jobtracker-fs';
const STORE = 'handles';
const KEY = 'backup';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandle(handle: BackupHandle): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadHandle(): Promise<BackupHandle | null> {
  const db = await openDB();
  try {
    return await new Promise<BackupHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as BackupHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function clearHandle(): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
