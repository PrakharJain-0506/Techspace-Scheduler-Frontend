import {
  CalendarEvent,
  ClubId,
  CurrentUser,
  GhostOverlapItem,
  GhostRange,
  MeetingClashItem,
} from '../types/calendar';
import { parseTimeToMinutes } from './dateUtils';
import { canViewPrivateDetails } from './permissions';

/**
 * True strictly when two time ranges intersect (back-to-back endpoints like 11:00 and 11:00 do NOT overlap).
 */
export function doIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  return sA < eB && sB < eA;
}

export function isDateInRange(
  dateKey: string,
  startDate: string,
  endDate: string
): boolean {
  return dateKey >= startDate && dateKey <= endDate;
}

/**
 * Returns true if any two distinct meetings on a single day actually overlap in time.
 * Busy days with back-to-back or separate meetings return false.
 */
export function hasActualTimeClashOnDay(dayEvents: CalendarEvent[]): boolean {
  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      if (
        doIntervalsOverlap(
          dayEvents[i].startTime,
          dayEvents[i].endTime,
          dayEvents[j].startTime,
          dayEvents[j].endTime
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

export function findMeetingClashes(
  candidate: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    clubId: ClubId;
  },
  existingEvents: CalendarEvent[],
  currentUser: CurrentUser
): MeetingClashItem[] {
  return existingEvents
    .filter((ev) => {
      if (candidate.id && ev.id === candidate.id) return false;
      if (ev.date !== candidate.date) return false;
      return doIntervalsOverlap(
        candidate.startTime,
        candidate.endTime,
        ev.startTime,
        ev.endTime
      );
    })
    .map((ev) => {
      const canSee = canViewPrivateDetails(currentUser, ev.clubId, ev.isPrivate);
      if (!canSee) {
        return {
          id: ev.id,
          title: 'Private Team Meeting',
          date: ev.date,
          startTime: ev.startTime,
          endTime: ev.endTime,
          location: 'Restricted',
          clubId: ev.clubId,
          isMaskedPrivate: true,
        };
      }
      return {
        id: ev.id,
        title: ev.title,
        date: ev.date,
        startTime: ev.startTime,
        endTime: ev.endTime,
        location: ev.location,
        clubId: ev.clubId,
        isMaskedPrivate: false,
      };
    });
}

export function findGhostRangeOverlaps(
  candidateDate: string,
  ghostRanges: GhostRange[],
  currentUser: CurrentUser
): GhostOverlapItem[] {
  return ghostRanges
    .filter((hold) => isDateInRange(candidateDate, hold.startDate, hold.endDate))
    .map((hold) => {
      const canSee = canViewPrivateDetails(
        currentUser,
        hold.clubId,
        hold.isPrivate
      );
      if (!canSee) {
        return {
          id: hold.id,
          title: 'Tentative private hold',
          startDate: hold.startDate,
          endDate: hold.endDate,
          clubId: hold.clubId,
          isDateOnly: hold.isDateOnly,
          isMaskedPrivate: true,
        };
      }
      return {
        id: hold.id,
        title: hold.title || 'Tentative Hold',
        startDate: hold.startDate,
        endDate: hold.endDate,
        clubId: hold.clubId,
        isDateOnly: hold.isDateOnly,
        isMaskedPrivate: false,
      };
    });
}
