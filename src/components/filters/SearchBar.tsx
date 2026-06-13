'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';

export function SearchBar({
  value, onChange, inputRef,
}: { value: string; onChange: (v: string) => void; inputRef?: React.RefObject<HTMLInputElement> }) {
  const { t } = useT();
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocal(value); }, [value]);

  function update(v: string) {
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), 300); // 300ms debounce (PRD §F8)
  }

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        ref={inputRef}
        value={local}
        onChange={(e) => update(e.target.value)}
        placeholder={t('header.searchPlaceholder')}
        aria-label={t('header.searchPlaceholder')}
        className="h-10 w-full rounded-lg surface-input pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange(''); }} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
