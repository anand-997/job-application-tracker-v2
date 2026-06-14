'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { cn } from '@/lib/utils';
import {
  getWeekDays, getEventsForDate, toISODate, isSameDay,
  WEEK_START_HOUR, WEEK_END_HOUR, PX_PER_MIN,
  timeToOffsetPx, durationToHeightPx, nowOffsetPx, format12h, formatTimeRange,
} from '@/lib/calendar-utils';
import { Popover } from '@/components/ui/Popover';
import { EventPopover } from './EventPopover';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOTAL_PX = (WEEK_END_HOUR - WEEK_START_HOUR) * 60 * PX_PER_MIN;
const HOURS = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR + 1 }, (_, i) => WEEK_START_HOUR + i);
const COLS = '60px repeat(7, minmax(0, 1fr))';

export function WeekView({
  weekDate, events, onOpenJob, allDayLabel,
}: { weekDate: Date; events: CalendarEvent[]; onOpenJob: (id: string) => void; allDayLabel: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const days = getWeekDays(weekDate);
  const today = new Date();

  return (
    <div className="flex h-full flex-col">
      {/* Day headers */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: COLS }}>
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={toISODate(d)} className="border-l border-border px-1 py-1.5 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">{WEEKDAYS[d.getDay()]}</div>
              <div className={cn('mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                isToday ? 'bg-accent text-white' : 'text-text-secondary')}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* All-day strip */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: COLS }}>
        <div className="px-1 py-1 text-right text-[10px] text-text-muted">{allDayLabel}</div>
        {days.map((d) => {
          const dayEvents = getEventsForDate(events, toISODate(d)).filter((e) => e.isAllDay);
          return (
            <div key={toISODate(d)} className="min-h-[34px] space-y-0.5 border-l border-border p-0.5">
              {dayEvents.map((ev) => (
                <Popover key={ev.id} align="start" width="w-auto"
                  trigger={({ toggle }) => (
                    <button onClick={(e) => { e.stopPropagation(); toggle(); }} title={ev.title}
                      style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}1a` }}
                      className={cn('block w-full truncate rounded-[4px] border-l-[3px] px-1 py-0.5 text-left text-[10px] text-text-primary', ev.isOverdue && 'line-through')}>
                      {ev.title}
                    </button>
                  )}>
                  {(close) => <EventPopover event={ev} onOpenJob={onOpenJob} close={close} />}
                </Popover>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: COLS, height: TOTAL_PX }}>
          {/* Hour gutter */}
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} style={{ top: (h - WEEK_START_HOUR) * 60 * PX_PER_MIN }}
                className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-text-muted">
                {format12h(`${h}:00`)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const iso = toISODate(d);
            const timed = getEventsForDate(events, iso).filter((e) => !e.isAllDay && e.time);
            const isToday = isSameDay(d, today);
            return (
              <div key={iso} className="relative border-l border-border">
                {/* hour lines */}
                {HOURS.map((h) => (
                  <div key={h} style={{ top: (h - WEEK_START_HOUR) * 60 * PX_PER_MIN }} className="absolute inset-x-0 border-t border-border/40" />
                ))}

                {/* current-time line */}
                {isToday && (() => {
                  const off = nowOffsetPx(now);
                  if (off < 0 || off > TOTAL_PX) return null;
                  return (
                    <div className="absolute inset-x-0 z-20 flex items-center" style={{ top: off }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-error" />
                      <span className="h-px flex-1 bg-error" />
                    </div>
                  );
                })()}

                {/* timed blocks */}
                {timed.map((ev) => (
                  <Popover key={ev.id} align="start" width="w-auto"
                    trigger={({ toggle }) => (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(); }}
                        style={{
                          top: timeToOffsetPx(ev.time!), height: durationToHeightPx(ev.durationMinutes ?? 60),
                          borderLeftColor: ev.color, backgroundColor: `${ev.color}26`,
                        }}
                        className="absolute inset-x-0.5 z-10 overflow-hidden rounded-[5px] border-l-[3px] px-1.5 py-0.5 text-left transition-shadow hover:shadow-card"
                      >
                        <span className="block truncate text-[11px] font-medium leading-tight text-text-primary">{ev.title}</span>
                        <span className="block truncate text-[10px] text-text-secondary">{formatTimeRange(ev.time, ev.endTime)}</span>
                        {ev.meetLink && <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-accent"><ExternalLink className="h-2.5 w-2.5" />{ev.meetPlatform ?? 'Meet'}</span>}
                      </button>
                    )}>
                    {(close) => <EventPopover event={ev} onOpenJob={onOpenJob} close={close} />}
                  </Popover>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
