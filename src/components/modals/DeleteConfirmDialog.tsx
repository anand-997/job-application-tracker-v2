'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { useT } from '@/i18n/I18nProvider';

export function DeleteConfirmDialog({
  open, onClose, onConfirm, company, role,
}: { open: boolean; onClose: () => void; onConfirm: () => void; company?: string; role?: string }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-error/15">
          <AlertTriangle className="h-5 w-5 text-error" />
        </div>
        <h3 className="font-display text-lg font-semibold text-text-primary">{t('confirm.deleteTitle')}</h3>
        <p className="mt-1.5 text-sm text-text-secondary">{t('confirm.deleteBody', { company: company ?? '', role: role ?? '' })}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('actions.cancel')}</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{t('actions.delete')}</Button>
        </div>
      </div>
    </Modal>
  );
}
