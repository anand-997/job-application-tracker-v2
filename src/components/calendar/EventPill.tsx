'use client';

import type { CalendarEvent } from '@/types';
import { cn } from '@/lib/utils';
import { Popover } from '@/components/ui/Popover';
import { EventPopover } from './EventPopover';

// A single colored pill in a month-view day cell. Click opens the detail popover.
export function EventPill({ event, onOpenJob }: { event: CalendarEvent; onOpenJob: (id: string) => void }) {
  return (
    <Popover
      align="start"
      width="w-auto"
      trigger={({ toggle }) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          title={event.title}
          style={{ borderLeftColor: event.color, backgroundColor: `${event.color}1a` }}
          className={cn(
            'flex w-full items-center gap-1 truncate rounded-[4px] border-l-[3px] px-1.5 py-0.5 text-left text-[11px] leading-tight text-text-primary transition-transform hover:translate-x-0.5',
            event.isOverdue && 'border-l-error line-through',
          )}
        >
          {!event.isAllDay && event.time && <span className="shrink-0 font-medium tabular-nums text-text-secondary">{event.time}</span>}
          <span className="truncate">{event.title}</span>
        </button>
      )}
    >
      {(close) => <EventPopover event={event} onOpenJob={onOpenJob} close={close} />}
    </Popover>
  );
}
