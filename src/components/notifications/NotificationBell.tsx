'use client';

import { Bell, BellRing, Check, CheckCheck } from 'lucide-react';
import type { AppNotification } from '@/types';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { Popover } from '@/components/ui/Popover';
import { requestBrowserPermission } from '@/lib/notifications';

export function NotificationBell({ onOpenJob }: { onOpenJob: (id: string) => void }) {
  const { notifications, unreadCount, markAllRead, dismissNotification } = useApp();
  const { t } = useT();

  return (
    <Popover
      width="w-80"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label={t('header.notifications')} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold text-text-primary">{t('header.notifications')}</span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
                <CheckCheck className="h-3.5 w-3.5" />{t('notif.markAllRead')}
              </button>
            )}
          </div>
          <div className="scroll-thin max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-text-muted">{t('notif.empty')}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (n.jobId) onOpenJob(n.jobId); dismissNotification(n.id); }}
                  className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-bg-hover"
                >
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  {n.read && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />}
                  <span className="text-xs text-text-secondary">{message(n, t)}</span>
                </button>
              ))
            )}
          </div>
          <div className="mt-1 border-t border-border px-2 py-1.5">
            <button onClick={() => requestBrowserPermission()} className="text-[11px] text-text-muted hover:text-accent">
              🔔 {t('notif.enableBrowser')}
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function message(n: AppNotification, t: (k: string, v?: Record<string, string | number>) => string): string {
  switch (n.type) {
    case 'followUpDue': return t('notif.followUpDue', { company: n.company ?? '' });
    case 'followUpOverdue': return t('notif.followUpOverdue', { company: n.company ?? '', n: n.days ?? 0 });
    case 'offerDeadline': return t('notif.offerDeadline', { company: n.company ?? '', n: n.days ?? 0 });
    case 'offerExpired': return t('notif.offerExpired', { company: n.company ?? '' });
    case 'autoGhosted': return t('notif.autoGhosted', { n: n.count ?? 0 });
    case 'interviewTomorrow': return t('notif.interviewTomorrow', { company: n.company ?? '' });
    default: return '';
  }
}
