'use client';

import { ArrowUpDown, Check } from 'lucide-react';
import type { SortKey } from '@/types';
import { useT } from '@/i18n/I18nProvider';
import { Popover, MenuItem } from '@/components/ui/Popover';
import { Button } from '@/components/ui/primitives';

const KEYS: SortKey[] = ['newest', 'oldest', 'company', 'priority', 'daysSince', 'salary'];

export function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const { t } = useT();
  return (
    <Popover
      width="w-52"
      trigger={({ toggle }) => (
        <Button variant="secondary" size="md" onClick={toggle}>
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">{t('sort.label')}</span>
        </Button>
      )}
    >
      {(close) => (
        <>
          {KEYS.map((k) => (
            <MenuItem key={k} icon={value === k ? <Check className="h-4 w-4 text-accent" /> : <span className="h-4 w-4" />} onClick={() => { onChange(k); close(); }}>
              {t(`sort.${k}`)}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}
