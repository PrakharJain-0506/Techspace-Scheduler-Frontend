import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  CalendarEvent,
  ClubId,
  ClubInfo,
  GhostRange,
  ThemeMode,
} from "../types/calendar";
import { CLUB_THEME_TOKENS, ThemePalette } from "../theme/calendarTheme";
import {
  formatMonthYearLabel,
  formatSelectedDayFull,
  getMonthGridDays,
} from "../utils/dateUtils";
import { hasActualTimeClashOnDay, isDateInRange } from "../utils/conflictUtils";

interface LeftPanelProps {
  theme: ThemeMode;
  palette: ThemePalette;
  miniYear: number;
  miniMonthIndex: number;
  onPrevMiniMonth: () => void;
  onNextMiniMonth: () => void;
  selectedDateKey: string | null;
  todayDateKey: string;
  onSelectDate: (dateKey: string) => void;
  events: CalendarEvent[];
  ghostRanges: GhostRange[];
  selectedDateMeetingCount: number;
  clubs: ClubInfo[];
  activeClubFilter?: ClubId | "all";
  selectedClubFilters?: ClubId[];
  onSelectClubFilter: (clubId: ClubId | "all") => void;
}

const MINI_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  theme,
  palette,
  miniYear,
  miniMonthIndex,
  onPrevMiniMonth,
  onNextMiniMonth,
  selectedDateKey,
  todayDateKey,
  onSelectDate,
  events,
  ghostRanges,
  selectedDateMeetingCount,
  clubs,
  activeClubFilter = "all",
  selectedClubFilters,
  onSelectClubFilter,
}) => {
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const isAllSelected =
    selectedClubFilters !== undefined
      ? selectedClubFilters.length === 0 ||
        selectedClubFilters.length === clubs.length
      : activeClubFilter === "all";

  const isClubSelected = (clubId: ClubId) => {
    if (selectedClubFilters !== undefined) {
      return !isAllSelected && selectedClubFilters.includes(clubId);
    }
    return activeClubFilter === clubId;
  };

  const miniDays = getMonthGridDays(miniYear, miniMonthIndex);

  // Group events by dateKey for density, busyness, and true time-clash detection
  const dayEventsMap = new Map<string, CalendarEvent[]>();
  const dateClubDotsMap = new Map<string, ClubId[]>();
  for (const ev of events) {
    const list = dayEventsMap.get(ev.date) ?? [];
    list.push(ev);
    dayEventsMap.set(ev.date, list);

    const existing = dateClubDotsMap.get(ev.date);
    if (!existing) {
      dateClubDotsMap.set(ev.date, [ev.clubId]);
    } else if (!existing.includes(ev.clubId) && existing.length < 3) {
      existing.push(ev.clubId);
    }
  }

  const isDark = theme === "dark";

  const miniSelectedBg = isDark
    ? "rgba(59, 130, 246, 0.16)"
    : "rgba(59, 130, 246, 0.11)";
  const miniSelectedBorder = isDark
    ? "rgba(59, 130, 246, 0.38)"
    : "rgba(59, 130, 246, 0.30)";
  const miniSelectedText = isDark ? "#60A5FA" : "#1D4ED8";

  const miniTodayBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(30, 27, 24, 0.055)";
  const miniTodayBorder = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(30, 27, 24, 0.12)";

  return (
    <aside
      className="w-full lg:h-full shrink-0 rounded-[20px] border p-4 flex flex-col justify-between transition-colors duration-150"
      style={{
        background: palette.surfaceBackground,
        borderColor: palette.border,
        boxShadow: palette.cardShadow,
      }}
    >
      <div>
        {/* Mini Calendar Section */}
        <div>
          <h2
            className="text-[15px] font-bold tracking-tight"
            style={{ color: palette.textPrimary }}
          >
            Your schedule
          </h2>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: palette.textMuted }}
          >
            A few upcoming events
          </p>

          {/* Mini Month Header */}
          <div className="flex items-center justify-between mt-4 mb-3">
            <button
              type="button"
              onClick={onPrevMiniMonth}
              aria-label="Previous month"
              className="ts-icon-btn w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
              style={{ color: palette.textSecondary }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span
              className="text-[11.5px] font-semibold tracking-wider whitespace-nowrap uppercase"
              style={{ color: palette.textPrimary }}
            >
              {formatMonthYearLabel(miniYear, miniMonthIndex)}
            </span>

            <button
              type="button"
              onClick={onNextMiniMonth}
              aria-label="Next month"
              className="ts-icon-btn w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
              style={{ color: palette.textSecondary }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-x-0.5 text-center mb-1.5">
            {MINI_WEEKDAYS.map((day) => (
              <span
                key={day}
                className="text-[10px] font-medium"
                style={{ color: palette.textMuted }}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Mini Calendar Days */}
          <div className="grid grid-cols-7 gap-x-0.5 gap-y-1">
            {miniDays.map((cell) => {
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayDateKey;
              const dayEvents = cell.isCurrentMonth
                ? (dayEventsMap.get(cell.dateKey) ?? [])
                : [];
              const clubDots = cell.isCurrentMonth
                ? (dateClubDotsMap.get(cell.dateKey) ?? [])
                : [];
              const isBusy = dayEvents.length >= 2;
              const hasClash = hasActualTimeClashOnDay(dayEvents);
              const hasGhostHold =
                cell.isCurrentMonth &&
                ghostRanges.some((g) =>
                  isDateInRange(cell.dateKey, g.startDate, g.endDate),
                );

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => onSelectDate(cell.dateKey)}
                  title={
                    hasClash
                      ? "Schedule clash detected"
                      : isBusy
                        ? `${dayEvents.length} meetings (busy day)`
                        : hasGhostHold
                          ? "Tentative hold"
                          : undefined
                  }
                  className="ts-mini-day relative h-8 w-full rounded-[7px] flex flex-col items-center justify-center gap-[2px] text-[11.5px] tabular-nums cursor-pointer"
                  data-selected={isSelected ? "true" : "false"}
                  style={{
                    backgroundColor: isSelected
                      ? miniSelectedBg
                      : isToday
                        ? miniTodayBg
                        : "transparent",
                    color: isSelected
                      ? miniSelectedText
                      : cell.isCurrentMonth
                        ? palette.textPrimary
                        : palette.textOutOfMonth,
                    fontWeight: isSelected || isToday ? 600 : 500,
                    border: isSelected
                      ? `1px solid ${miniSelectedBorder}`
                      : isToday
                        ? `1px solid ${miniTodayBorder}`
                        : hasGhostHold
                          ? `1px dashed ${palette.border}`
                          : "1px solid transparent",
                  }}
                >
                  {hasClash && (
                    <AlertTriangle
                      className="absolute top-[2px] right-[2px] w-[8px] h-[8px]"
                      style={{ color: palette.mandatoryBadgeText }}
                    />
                  )}
                  <span className="leading-none">{cell.dayNumber}</span>
                  <span className="h-[4px] flex items-center justify-center gap-[2px]">
                    {clubDots.map((clubId) => (
                      <span
                        key={clubId}
                        className="w-[3.5px] h-[3.5px] rounded-full shrink-0"
                        style={{
                          backgroundColor: CLUB_THEME_TOKENS[theme][clubId].dot,
                        }}
                      />
                    ))}
                    {isBusy && clubDots.length === 1 && (
                      <span
                        className="w-[3px] h-[3px] rounded-full shrink-0 opacity-60"
                        style={{ backgroundColor: palette.textMuted }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day Meeting Summary */}
          <div className="flex items-center gap-2 mt-3 pt-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: "#3B82F6" }}
            />
            <span
              className="text-[11px] truncate tabular-nums"
              style={{ color: palette.textSecondary }}
            >
              {selectedDateKey
                ? `${selectedDateMeetingCount} ${
                    selectedDateMeetingCount === 1 ? "meeting" : "meetings"
                  } on ${formatSelectedDayFull(selectedDateKey)}`
                : `${selectedDateMeetingCount} ${
                    selectedDateMeetingCount === 1 ? "meeting" : "meetings"
                  } today`}
            </span>
          </div>
        </div>

        {/* Hairline Divider */}
        <div
          className="my-4 border-t"
          style={{ borderColor: palette.gridLine }}
        />

        {/* Club Filters Section */}
        <div>
          <div className="flex items-center justify-between">
            <h3
              className="text-[15px] font-bold tracking-tight"
              style={{ color: palette.textPrimary }}
            >
              Club filters
            </h3>
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              aria-expanded={filtersExpanded}
              className="ts-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold border cursor-pointer tabular-nums"
              style={{
                backgroundColor: palette.buttonMutedBg,
                borderColor: palette.border,
                color: palette.textPrimary,
              }}
            >
              <span>{clubs.length}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  filtersExpanded ? "" : "-rotate-90"
                }`}
              />
            </button>
          </div>

          {filtersExpanded && (
            <div className="mt-3 space-y-2">
              {/* All Clubs Row */}
              <button
                type="button"
                onClick={() => onSelectClubFilter("all")}
                className="ts-filter-row w-full flex items-center justify-between px-3 py-2.5 rounded-[11px] border text-left cursor-pointer"
                style={{
                  background: isAllSelected
                    ? palette.accentSoftBg
                    : palette.surfaceElevated,
                  borderColor: isAllSelected
                    ? palette.accentSoftBorder
                    : palette.border,
                }}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDark
                        ? palette.textMuted
                        : palette.accentBg,
                    }}
                  />
                  <span
                    className="text-[12.5px] font-semibold truncate"
                    style={{ color: palette.textPrimary }}
                  >
                    All Clubs
                  </span>
                </span>
                <span
                  className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 border transition-colors"
                  style={{
                    backgroundColor: isAllSelected
                      ? palette.accentBg
                      : "transparent",
                    borderColor: isAllSelected
                      ? palette.accentBg
                      : palette.border,
                    color: palette.accentText,
                  }}
                >
                  {isAllSelected && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </span>
              </button>

              {/* Individual Club Filter Rows */}
              {clubs.map((club) => {
                const isSelected = isClubSelected(club.id);
                const clubTokens = CLUB_THEME_TOKENS[theme][club.id];
                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => onSelectClubFilter(club.id)}
                    className="ts-filter-row group w-full flex items-center justify-between px-3 py-2.5 rounded-[11px] border text-left cursor-pointer"
                    style={{
                      background: isSelected
                        ? clubTokens.filterRowActiveBg
                        : palette.surfaceElevated,
                      borderColor: isSelected
                        ? clubTokens.filterRowActiveBorder
                        : palette.border,
                    }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: clubTokens.dot }}
                      />
                      <span
                        className="text-[12.5px] font-medium truncate"
                        style={{
                          color: isSelected
                            ? palette.textPrimary
                            : palette.textSecondary,
                          fontWeight: isSelected ? 600 : 500,
                        }}
                      >
                        {club.name}
                      </span>
                    </span>
                    <span
                      className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 border transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? clubTokens.dot
                          : "transparent",
                        borderColor: isSelected
                          ? clubTokens.dot
                          : palette.border,
                        color: "#FFFFFF",
                      }}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
