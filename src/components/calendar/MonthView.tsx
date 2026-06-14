'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { CalendarEvent } from '@/types';
import { cn } from '@/lib/utils';
import { getMonthMatrix, groupEventsByDate, toISODate, isSameDay, isSameMonth } from '@/lib/calendar-utils';
import { Popover } from '@/components/ui/Popover';
import { EventPill } from './EventPill';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PILLS = 3;

export function MonthView({
  monthDate, events, onOpenJob, moreLabel,
}: { monthDate: Date; events: CalendarEvent[]; onOpenJob: (id: string) => void; moreLabel: (n: number) => string }) {
  const reduce = useReducedMotion();
  const weeks = getMonthMatrix(monthDate);
  const byDate = groupEventsByDate(events);
  const today = new Date();
  const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

  return (
    <div className="flex h-full flex-col">
      {/* Weekday header */}
      <div className="grid shrink-0 grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">{d}</div>
        ))}
      </div>

      {/* Day grid — fills the area when it fits, scrolls when the viewport is short */}
      <motion.div
        key={monthKey}
        className="scroll-thin grid flex-1 auto-rows-[minmax(84px,1fr)] grid-cols-7 overflow-y-auto"
        initial={reduce ? false : 'hidden'}
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.008 } } }}
      >
        {weeks.flat().map((day) => {
          const iso = toISODate(day);
          const dayEvents = byDate.get(iso) ?? [];
          const inMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, today);
          const overflow = dayEvents.length - MAX_PILLS;

          return (
            <motion.div
              key={iso}
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              className={cn(
                'border-b border-r border-border p-1',
                !inMonth && 'bg-bg-hover/40',
                isToday && 'ring-1 ring-inset ring-accent/60',
              )}
            >
              <div className="mb-0.5 flex justify-end">
                <span className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium',
                  isToday ? 'bg-accent text-white' : inMonth ? 'text-text-secondary' : 'text-text-muted',
                )}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_PILLS).map((ev) => <EventPill key={ev.id} event={ev} onOpenJob={onOpenJob} />)}
                {overflow > 0 && (
                  <Popover
                    align="start"
                    width="w-64"
                    trigger={({ toggle }) => (
                      <button onClick={(e) => { e.stopPropagation(); toggle(); }} className="w-full rounded px-1.5 text-left text-[11px] font-medium text-text-muted hover:text-accent">
                        {moreLabel(overflow)}
                      </button>
                    )}
                  >
                    {(close) => (
                      <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5">
                        {dayEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => { onOpenJob(ev.applicationId); close(); }}
                            style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}14` }}
                            className="flex w-full items-center gap-1.5 truncate rounded-[4px] border-l-[3px] px-2 py-1 text-left text-xs text-text-primary hover:bg-bg-hover"
                          >
                            {ev.time && <span className="shrink-0 tabular-nums text-text-secondary">{ev.time}</span>}
                            <span className="truncate">{ev.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Popover>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
