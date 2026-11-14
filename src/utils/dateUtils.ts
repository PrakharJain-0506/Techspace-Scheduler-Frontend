const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const SHORT_WEEKDAYS_MON_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_WEEKDAYS_SUN_START = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const SHORT_WEEKDAYS_SUN_START = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date());
}

/**
 * Parses a local dateKey (YYYY-MM-DD) and time24 (HH:mm) into a local Date object,
 * using local year, month, day, hour, minute (avoiding UTC conversion bugs).
 */
export function parseLocalDateTime(dateKey: string, time24: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, min] = time24.split(':').map(Number);
  return new Date(y, m - 1, d, h ?? 0, min ?? 0, 0, 0);
}

/**
 * Returns true if the given local date (YYYY-MM-DD) and time (HH:mm) is strictly
 * after the reference local time (defaults to new Date()).
 * If the start date/time is earlier than or equal to current local time, returns false.
 */
export function isFutureDateTime(
  dateKey: string,
  time24: string,
  now: Date = new Date()
): boolean {
  if (!dateKey || !time24) return false;
  const targetDate = parseLocalDateTime(dateKey, time24);
  return targetDate.getTime() > now.getTime();
}

/**
 * Returns the current local time in 24-hour format HH:mm.
 */
export function getCurrentLocalTime24(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function addDays(dateKey: string, delta: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + delta);
  return formatDateKey(d);
}

export function addMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

/**
 * Monday-start weekday index (0 = Mon ... 6 = Sun)
 */
export function getMondayWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export interface GridDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

/**
 * Generates Monday-start calendar grid rows for a given year & monthIndex (0-11).
 * Always returns complete weeks (35 or 42 days).
 */
export function getMonthGridDays(year: number, monthIndex: number): GridDay[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = getMondayWeekdayIndex(firstOfMonth);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;
  const startDate = new Date(year, monthIndex, 1 - startOffset);

  const days: GridDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    days.push({
      dateKey: formatDateKey(d),
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === monthIndex && d.getFullYear() === year,
    });
  }
  return days;
}

/**
 * Returns the 7 days (Mon..Sun) for the week containing `dateKey`.
 */
export function getWeekDays(dateKey: string): {
  dateKey: string;
  dayNumber: number;
  shortWeekday: string;
  shortMonthDay: string;
}[] {
  const anchor = parseDateKey(dateKey);
  const mondayOffset = getMondayWeekdayIndex(anchor);
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      dateKey: formatDateKey(d),
      dayNumber: d.getDate(),
      shortWeekday: SHORT_WEEKDAYS_MON_START[i],
      shortMonthDay: `${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
    };
  });
}

export function formatMonthYearLabel(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function formatWeekRangeLabel(anchorDateKey: string): string {
  const week = getWeekDays(anchorDateKey);
  const start = parseDateKey(week[0].dateKey);
  const end = parseDateKey(week[6].dateKey);

  const startMonth = SHORT_MONTH_NAMES[start.getMonth()];
  const endMonth = SHORT_MONTH_NAMES[end.getMonth()];

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export function formatSelectedDayShort(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${SHORT_WEEKDAYS_SUN_START[d.getDay()]}, ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function formatSelectedDayFull(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${FULL_WEEKDAYS_SUN_START[d.getDay()]}, ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function formatFullDateWithYear(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${FULL_WEEKDAYS_SUN_START[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function parseTimeToMinutes(time24: string): number {
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m;
}

export function formatCompactHour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${pad2(m)}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startPeriod = sh >= 12 ? 'PM' : 'AM';
  const endPeriod = eh >= 12 ? 'PM' : 'AM';
  const sh12 = sh % 12 === 0 ? 12 : sh % 12;
  const eh12 = eh % 12 === 0 ? 12 : eh % 12;

  const startStr = `${sh12}:${pad2(sm)}`;
  const endStr = `${eh12}:${pad2(em)} ${endPeriod}`;

  if (startPeriod === endPeriod) {
    return `${startStr} – ${endStr}`;
  }
  return `${startStr} ${startPeriod} – ${endStr}`;
}

export function formatCompactWeekTimeRange(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startPeriod = sh >= 12 ? 'PM' : 'AM';
  const endPeriod = eh >= 12 ? 'PM' : 'AM';
  const sh12 = sh % 12 === 0 ? 12 : sh % 12;
  const eh12 = eh % 12 === 0 ? 12 : eh % 12;

  const s = sm === 0 ? `${sh12}` : `${sh12}:${pad2(sm)}`;
  const e = em === 0 ? `${eh12}` : `${eh12}:${pad2(em)}`;
  if (startPeriod === endPeriod) {
    return `${s} – ${e} ${endPeriod}`;
  }
  return `${s} ${startPeriod} – ${e} ${endPeriod}`;
}
