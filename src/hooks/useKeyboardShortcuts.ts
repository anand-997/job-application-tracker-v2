'use client';

import { useEffect } from 'react';

function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(handlers: {
  onSearch: () => void;
  onNew: () => void;
  onHelp: () => void;
  onQuickStatus: (index: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ctrl/Cmd + K → search (always)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onSearch();
        return;
      }
      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === 'n') { e.preventDefault(); handlers.onNew(); }
      else if (e.key === '?') { e.preventDefault(); handlers.onHelp(); }
      else if (/^[1-9]$/.test(e.key)) { handlers.onQuickStatus(Number(e.key) - 1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
