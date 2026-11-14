import {
  Announcement,
  AppNotification,
  AttendanceType,
  CalendarEvent,
  ClashCheckResult,
  ClubId,
  CurrentUser,
  GhostRange,
  MeetingType,
} from '../types/calendar';
import { findMeetingClashes } from '../utils/conflictUtils';
import { isFutureDateTime } from '../utils/dateUtils';
import {
  canCancelMeeting,
  canCreateGhostRange,
  canCreateMeetingForTeam,
  canEditMeeting,
  canManageGhostRange,
  canPublishAnnouncement,
} from '../utils/permissions';

export interface CreateMeetingPayload {
  title: string;
  meetingType: MeetingType;
  clubId: ClubId;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingLink?: string;
  attendance: AttendanceType;
  description?: string;
  confirmOverride?: boolean;
}

export interface UpdateMeetingPayload extends CreateMeetingPayload {
  id: string;
}

export interface CreateGhostRangePayload {
  title: string;
  note?: string;
  clubId: ClubId;
  startDate: string;
  endDate: string;
  isDateOnly: boolean;
  startTime?: string;
  endTime?: string;
  isPrivate?: boolean;
}

export interface CreateAnnouncementPayload {
  clubId?: ClubId;
  title: string;
  content: string;
}

export class ApiServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Production backend base URL (empty in standalone frontend preview).
 * When configured, meeting mutations and clash checks target documented
 * /api/v1/meetings endpoints without silent demo fallback on failure.
 */
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env
    ? ((import.meta as any).env.VITE_API_BASE_URL as string | undefined)
    : undefined
  )?.trim() ?? '';

export const isBackendConfigured = Boolean(API_BASE_URL);

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code = 'API_ERROR';
    try {
      const data = (await res.json()) as { message?: string; code?: string };
      if (data.message) message = data.message;
      if (data.code) code = data.code;
    } catch {
      // ignore non-JSON error body
    }
    throw new ApiServiceError(message, res.status, code);
  }
  return (await res.json()) as T;
}

// ============================================================================
// 1. MEETING SERVICE (Documented contracts: POST /api/v1/meetings & check-clash)
// ============================================================================

export async function checkMeetingClash(
  candidate: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    clubId: ClubId;
  },
  existingEvents: CalendarEvent[],
  currentUser: CurrentUser
): Promise<ClashCheckResult> {
  if (isBackendConfigured) {
    const res = await fetch(`${API_BASE_URL}/api/v1/meetings/check-clash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(candidate),
    });
    return parseJsonOrThrow<ClashCheckResult>(res);
  }

  // Clearly labeled local demo adapter when no backend server is attached
  const conflicts = findMeetingClashes(candidate, existingEvents, currentUser);
  if (conflicts.length > 0) {
    return {
      hasClash: true,
      code: 'MEETING_CLASH',
      conflicts,
    };
  }
  return { hasClash: false, conflicts: [] };
}

export async function createMeeting(
  payload: CreateMeetingPayload,
  existingEvents: CalendarEvent[],
  currentUser: CurrentUser
): Promise<CalendarEvent> {
  if (!isFutureDateTime(payload.date, payload.startTime)) {
    throw new ApiServiceError(
      'Meetings can only be scheduled for a future date and time.',
      400,
      'INVALID_DATETIME'
    );
  }

  if (!canCreateMeetingForTeam(currentUser, payload.clubId)) {
    throw new ApiServiceError(
      'You are not authorized to schedule meetings for this team.',
      403,
      'FORBIDDEN'
    );
  }
  if (payload.clubId === 'announcements') {
    throw new ApiServiceError(
      'The Announcements club is reserved for announcements, not meetings.',
      400,
      'INVALID_CLUB'
    );
  }
  if (payload.meetingType === 'Sub-Club' && payload.clubId === 'core-team') {
    throw new ApiServiceError(
      'Sub-Club meetings must be assigned to a sub-club.',
      400,
      'INVALID_CLUB'
    );
  }
  if (
    (payload.meetingType === 'Core Team' || payload.meetingType === 'OB') &&
    payload.clubId !== 'core-team'
  ) {
    throw new ApiServiceError(
      'Core Team and OB meetings must be assigned to the Core Team club.',
      400,
      'INVALID_CLUB'
    );
  }

  if (isBackendConfigured) {
    const res = await fetch(`${API_BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return parseJsonOrThrow<CalendarEvent>(res);
  }

  // Local demo adapter: enforce clash check unless user explicitly confirmed override
  const clash = await checkMeetingClash(
    {
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      clubId: payload.clubId,
    },
    existingEvents,
    currentUser
  );

  if (clash.hasClash && !payload.confirmOverride) {
    throw new ApiServiceError(
      'Schedule clash detected. Review conflicting meetings before confirming.',
      409,
      'MEETING_CLASH'
    );
  }

  return {
    id: `evt-${Date.now()}`,
    title: payload.title.trim(),
    shortTitle: payload.title.trim().slice(0, 14),
    meetingType: payload.meetingType,
    clubId: payload.clubId,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    location: payload.location.trim() || 'TechSpace Room',
    meetingLink: payload.meetingLink?.trim() || undefined,
    attendance: payload.attendance,
    organizer: currentUser.name,
    createdById: currentUser.id,
    description:
      payload.description?.trim() ||
      `${payload.meetingType} meeting scheduled by ${currentUser.name}.`,
  };
}

export async function updateMeeting(
  payload: UpdateMeetingPayload,
  existingEvents: CalendarEvent[],
  currentUser: CurrentUser
): Promise<CalendarEvent> {
  const target = existingEvents.find((ev) => ev.id === payload.id);
  if (!target || !canEditMeeting(currentUser, target)) {
    throw new ApiServiceError(
      'You are not authorized to edit this meeting.',
      403,
      'FORBIDDEN'
    );
  }

  const isRescheduling =
    payload.date !== target.date || payload.startTime !== target.startTime;

  if (isRescheduling && !isFutureDateTime(payload.date, payload.startTime)) {
    throw new ApiServiceError(
      'Meetings can only be scheduled for a future date and time.',
      400,
      'INVALID_DATETIME'
    );
  }
  if (payload.clubId === 'announcements') {
    throw new ApiServiceError(
      'The Announcements club is reserved for announcements, not meetings.',
      400,
      'INVALID_CLUB'
    );
  }
  if (payload.meetingType === 'Sub-Club' && payload.clubId === 'core-team') {
    throw new ApiServiceError(
      'Sub-Club meetings must be assigned to a sub-club.',
      400,
      'INVALID_CLUB'
    );
  }
  if (
    (payload.meetingType === 'Core Team' || payload.meetingType === 'OB') &&
    payload.clubId !== 'core-team'
  ) {
    throw new ApiServiceError(
      'Core Team and OB meetings must be assigned to the Core Team club.',
      400,
      'INVALID_CLUB'
    );
  }

  if (isBackendConfigured) {
    const res = await fetch(`${API_BASE_URL}/api/v1/meetings/${payload.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return parseJsonOrThrow<CalendarEvent>(res);
  }

  const clash = await checkMeetingClash(
    {
      id: payload.id,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      clubId: payload.clubId,
    },
    existingEvents,
    currentUser
  );

  if (clash.hasClash && !payload.confirmOverride) {
    throw new ApiServiceError(
      'Schedule clash detected. Review conflicting meetings before confirming.',
      409,
      'MEETING_CLASH'
    );
  }

  return {
    ...target,
    title: payload.title.trim(),
    shortTitle: payload.title.trim().slice(0, 14),
    meetingType: payload.meetingType,
    clubId: payload.clubId,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    location: payload.location.trim() || target.location,
    meetingLink: payload.meetingLink?.trim() || undefined,
    attendance: payload.attendance,
    description: payload.description?.trim() ?? target.description,
  };
}

export async function cancelMeeting(
  meetingId: string,
  existingEvents: CalendarEvent[],
  currentUser: CurrentUser
): Promise<void> {
  const target = existingEvents.find((ev) => ev.id === meetingId);
  if (!target || !canCancelMeeting(currentUser, target)) {
    throw new ApiServiceError(
      'You are not authorized to cancel this meeting.',
      403,
      'FORBIDDEN'
    );
  }

  if (isBackendConfigured) {
    const res = await fetch(`${API_BASE_URL}/api/v1/meetings/${meetingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await parseJsonOrThrow<unknown>(res);
  }
}

// ============================================================================
// 2. ANNOUNCEMENTS SERVICE (No backend contract in schema -> Typed Demo Adapter)
// ============================================================================

export async function publishAnnouncementDemo(
  payload: CreateAnnouncementPayload,
  currentUser: CurrentUser
): Promise<Announcement> {
  const targetClubId =
    payload.clubId ??
    (currentUser.role === 'team_lead'
      ? currentUser.authorizedTeams[0]
      : 'announcements');

  if (!canPublishAnnouncement(currentUser, targetClubId)) {
    throw new ApiServiceError(
      currentUser.role === 'team_lead'
        ? 'Team Leads can only publish announcements for their authorized teams.'
        : 'You are not authorized to publish announcements.',
      403,
      'FORBIDDEN'
    );
  }

  return {
    id: `ann-${Date.now()}`,
    clubId: targetClubId,
    title: payload.title.trim(),
    content: payload.content.trim(),
    publisherName: currentUser.name,
    publisherRole: currentUser.role,
    createdAt: new Date().toISOString(),
    isDemoOnly: true,
  };
}

// ============================================================================
// 3. GHOST RANGES SERVICE (No backend contract in schema -> Typed Demo Adapter)
// ============================================================================

export async function createGhostRangeDemo(
  payload: CreateGhostRangePayload,
  currentUser: CurrentUser
): Promise<GhostRange> {
  if (!canCreateGhostRange(currentUser, payload.clubId)) {
    throw new ApiServiceError(
      'You are not authorized to create tentative holds for this team.',
      403,
      'FORBIDDEN'
    );
  }

  return {
    id: `ghost-${Date.now()}`,
    title: payload.title.trim() || 'Tentative Hold',
    note: payload.note?.trim() || undefined,
    clubId: payload.clubId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    isDateOnly: payload.isDateOnly,
    startTime: payload.isDateOnly ? undefined : payload.startTime,
    endTime: payload.isDateOnly ? undefined : payload.endTime,
    isPrivate: payload.isPrivate,
    createdById: currentUser.id,
    createdByName: currentUser.name,
  };
}

export async function updateGhostRangeDemo(
  holdId: string,
  updates: Partial<CreateGhostRangePayload>,
  existingHolds: GhostRange[],
  currentUser: CurrentUser
): Promise<GhostRange> {
  const target = existingHolds.find((h) => h.id === holdId);
  if (!target || !canManageGhostRange(currentUser, target)) {
    throw new ApiServiceError(
      'You are not authorized to edit this tentative hold.',
      403,
      'FORBIDDEN'
    );
  }

  return {
    ...target,
    ...updates,
    title:
      updates.title !== undefined
        ? updates.title.trim() || 'Tentative Hold'
        : target.title,
    note: updates.note !== undefined ? updates.note.trim() || undefined : target.note,
  };
}

export async function removeGhostRangeDemo(
  holdId: string,
  existingHolds: GhostRange[],
  currentUser: CurrentUser
): Promise<void> {
  const target = existingHolds.find((h) => h.id === holdId);
  if (!target || !canManageGhostRange(currentUser, target)) {
    throw new ApiServiceError(
      'You are not authorized to remove this tentative hold.',
      403,
      'FORBIDDEN'
    );
  }
}

// ============================================================================
// 4. LOCAL DEMO NOTIFICATIONS HELPER (Deduplicated)
// ============================================================================

export function addDeduplicatedNotification(
  existing: AppNotification[],
  next: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): AppNotification[] {
  if (existing.some((n) => n.dedupeKey === next.dedupeKey)) {
    return existing;
  }
  return [
    {
      ...next,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    },
    ...existing,
  ];
}
