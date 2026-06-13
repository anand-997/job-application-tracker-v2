'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/context/ToastProvider';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-xl border border-border surface px-4 py-3 shadow-modal',
            )}
          >
            <span className="shrink-0">
              {t.variant === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
              {t.variant === 'error' && <AlertCircle className="h-5 w-5 text-error" />}
              {(!t.variant || t.variant === 'default') && <Info className="h-5 w-5 text-accent" />}
            </span>
            <p className="flex-1 text-sm text-text-primary">{t.message}</p>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-hover"
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
