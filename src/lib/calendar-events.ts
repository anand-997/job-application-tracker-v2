// Pure, side-effect-free derivation of calendar events from applications[].
// NEVER stored — computed at render time. The underlying data (interview-round
// fields + application dates) persists via the normal app state → localStorage
// and the linked data-folder backup, so events survive reload/restore for free.

import { isToday, isPast, parseISO } from 'date-fns';
import type { CalendarEvent, JobApplication } from '@/types';

export const EVENT_COLORS = {
  interview_round: '#7F77DD',
  follow_up: '#EF9F27',
  offer_deadline: '#E24B4A',
  applied: '#378ADD',
  offer_received: '#639922',
  interview_scheduled: '#D4537E',
} as const;

// "14:30" + 60 → "15:30"
export function computeEndTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function safeFlags(dateISO: string): { isToday: boolean; isPast: boolean } {
  try {
    const d = parseISO(dateISO);
    if (Number.isNaN(d.getTime())) return { isToday: false, isPast: false };
    return { isToday: isToday(d), isPast: isPast(d) };
  } catch {
    return { isToday: false, isPast: false };
  }
}

export function generateCalendarEvents(applications: JobApplication[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const app of applications) {
    const base = {
      applicationId: app.id,
      company: app.company,
      role: app.role,
      source: app.source,
    };

    // Applied — all-day, blue
    if (app.appliedDate) {
      const f = safeFlags(app.appliedDate);
      events.push({
        ...base,
        id: `${app.id}_applied`,
        type: 'applied',
        title: `Applied — ${app.company}`,
        subtitle: app.role,
        color: EVENT_COLORS.applied,
        colorLabel: 'blue',
        date: app.appliedDate,
        isAllDay: true,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: false,
        clickAction: 'open_job_drawer',
      });
    }

    // Follow-up — all-day, amber (overdue when past)
    if (app.followUpDate) {
      const f = safeFlags(app.followUpDate);
      events.push({
        ...base,
        id: `${app.id}_followup`,
        type: 'follow_up',
        title: `Follow-up — ${app.company}`,
        subtitle: app.role,
        color: EVENT_COLORS.follow_up,
        colorLabel: 'amber',
        date: app.followUpDate,
        isAllDay: true,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: f.isPast,
        clickAction: 'open_job_drawer',
      });
    }

    // Offer response deadline — all-day, red (overdue when past)
    if (app.responseDeadline) {
      const f = safeFlags(app.responseDeadline);
      events.push({
        ...base,
        id: `${app.id}_deadline`,
        type: 'offer_deadline',
        title: `Offer deadline — ${app.company}`,
        subtitle: `Respond by ${app.responseDeadline}`,
        color: EVENT_COLORS.offer_deadline,
        colorLabel: 'red',
        date: app.responseDeadline,
        isAllDay: true,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: f.isPast,
        clickAction: 'open_job_drawer',
      });
    }

    // Offer received — all-day, green
    if (app.offerDate) {
      const f = safeFlags(app.offerDate);
      events.push({
        ...base,
        id: `${app.id}_offer`,
        type: 'offer_received',
        title: `Offer received — ${app.company}`,
        subtitle: app.role,
        color: EVENT_COLORS.offer_received,
        colorLabel: 'green',
        date: app.offerDate,
        isAllDay: true,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: false,
        clickAction: 'open_job_drawer',
      });
    }

    // Interview date from card — all-day, pink
    if (app.interviewDate) {
      const f = safeFlags(app.interviewDate);
      events.push({
        ...base,
        id: `${app.id}_interview`,
        type: 'interview_scheduled',
        title: `Interview — ${app.company}`,
        subtitle: app.role,
        color: EVENT_COLORS.interview_scheduled,
        colorLabel: 'pink',
        date: app.interviewDate,
        isAllDay: true,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: false,
        clickAction: 'open_job_drawer',
      });
    }

    // Interview rounds — timed, purple
    for (const round of app.interviewRounds) {
      if (!round.scheduledDate) continue;
      const f = safeFlags(round.scheduledDate);
      const duration = round.durationMinutes ?? 60;
      const endTime = round.scheduledTime ? computeEndTime(round.scheduledTime, duration) : undefined;
      const roundTypeLabel = round.type.charAt(0).toUpperCase() + round.type.slice(1);

      events.push({
        ...base,
        id: `${app.id}_round_${round.id}`,
        type: 'interview_round',
        title: `${roundTypeLabel} interview — ${app.company} · R${round.roundNumber}`,
        subtitle: [round.interviewer, `${duration} min`].filter(Boolean).join(' · '),
        color: EVENT_COLORS.interview_round,
        colorLabel: 'purple',
        date: round.scheduledDate,
        time: round.scheduledTime,
        endTime,
        durationMinutes: duration,
        isAllDay: !round.scheduledTime,
        isToday: f.isToday,
        isPast: f.isPast,
        isOverdue: false,
        roundId: round.id,
        meetLink: round.meetLink,
        meetPlatform: round.meetPlatform,
        location: round.location,
        interviewer: round.interviewer,
        preparationNotes: round.preparationNotes,
        reminderMinutes: round.reminderMinutes,
        clickAction: 'open_round_modal',
      });
    }
  }

  return events.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    if (!a.time) return -1;
    if (!b.time) return 1;
    return a.time.localeCompare(b.time);
  });
}
