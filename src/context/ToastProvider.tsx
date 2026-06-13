'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { uuid } from '@/lib/utils';

export interface Toast {
  id: string;
  message: string;
  variant?: 'default' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = uuid();
      const duration = t.duration ?? 4000;
      setToasts((prev) => [...prev, { ...t, id }]);
      const tm = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, tm);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
