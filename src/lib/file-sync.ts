// Browser-only File System Access API helpers + IndexedDB handle persistence.
// The user links a *data folder* on disk; JobTracker reads/creates a fixed file
// (BACKUP_FILENAME) inside it and keeps it in sync with every change. This API
// is Chromium-only (Chrome/Edge/Opera) — callers MUST check `fsaSupported()` and
// fall back to localStorage + download/upload on Firefox/Safari. Handles are NOT
// JSON-serializable, so the directory handle lives in IndexedDB rather than the
// `jobtracker_v3` localStorage blob.

export const BACKUP_FILENAME = 'jobtracker-backup.json';

type FsPermissionState = 'granted' | 'denied' | 'prompt';

// Minimal local typing for the File System Access API (not in this project's TS
// lib target). We declare only the bits we use; the real objects come from the
// pickers, so casts via `unknown` are safe here.
interface PermissionAware {
  queryPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<FsPermissionState>;
  requestPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<FsPermissionState>;
}

export interface BackupFileHandle extends PermissionAware {
  readonly name: string;
  readonly kind: 'file';
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  getFile: () => Promise<File>;
}

export interface BackupDirHandle extends PermissionAware {
  readonly name: string;
  readonly kind: 'directory';
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<BackupFileHandle>;
}

interface FsaWindow {
  showDirectoryPicker: (opts?: unknown) => Promise<BackupDirHandle>;
}

export function fsaSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Folder picker, opening under the user's Documents folder. Throws AbortError if
// the user cancels — callers catch it.
export async function pickDataFolder(): Promise<BackupDirHandle> {
  const w = window as unknown as FsaWindow;
  return w.showDirectoryPicker({ id: 'jobtracker', mode: 'readwrite', startIn: 'documents' });
}

// Resolve the JobTracker data file inside a folder. With `create:false` a missing
// file rejects (NotFoundError) → caller treats the folder as having no data yet.
export async function getDataFileHandle(dir: BackupDirHandle, create: boolean): Promise<BackupFileHandle> {
  return dir.getFileHandle(BACKUP_FILENAME, { create });
}

export async function dataFileExists(dir: BackupDirHandle): Promise<BackupFileHandle | null> {
  try {
    return await getDataFileHandle(dir, false);
  } catch {
    return null; // NotFoundError — no JobTracker file in this folder
  }
}

export async function writeFile(handle: BackupFileHandle, data: unknown): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function readFile(handle: BackupFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

// Browsers require a user gesture to (re-)grant access to a remembered handle.
export async function verifyPermission(handle: PermissionAware, readWrite: boolean): Promise<boolean> {
  const mode = readWrite ? 'readwrite' : 'read';
  if ((await handle.queryPermission({ mode })) === 'granted') return true;
  return (await handle.requestPermission({ mode })) === 'granted';
}

// ── IndexedDB store for the directory handle ── (survives reloads so we can
// auto-detect the folder; permission still needs a gesture to resume).
const DB_NAME = 'jobtracker-fs';
const STORE = 'handles';
const KEY = 'dataDir';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandle(handle: BackupDirHandle): Promise<void> {
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

export async function loadHandle(): Promise<BackupDirHandle | null> {
  const db = await openDB();
  try {
    return await new Promise<BackupDirHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as BackupDirHandle) ?? null);
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
