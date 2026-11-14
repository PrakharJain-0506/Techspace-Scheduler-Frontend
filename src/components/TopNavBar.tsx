import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  Bell,
  Sun,
  Moon,
  User,
  X,
  MapPin,
  Clock,
  Megaphone,
  AlertTriangle,
  Check,
  CheckCircle2,
} from 'lucide-react';
import {
  Announcement,
  AppNotification,
  CalendarEvent,
  ClubInfo,
  CurrentUser,
  ThemeMode,
  UserRole,
} from '../types/calendar';
import { CLUB_THEME_TOKENS, ThemePalette } from '../theme/calendarTheme';
import { formatTimeRange } from '../utils/dateUtils';
import { canAccessAdminControls, ROLE_LABELS } from '../utils/permissions';

interface TopNavBarProps {
  theme: ThemeMode;
  palette: ThemePalette;
  currentUser: CurrentUser;
  onSelectDemoRole: (role: UserRole) => void;
  onBrandClick: () => void;
  onToggleTheme: () => void;
  todayEvents: CalendarEvent[];
  clubs: ClubInfo[];
  announcements: Announcement[];
  dismissedAnnouncementIds: string[];
  onDismissAnnouncement: (id: string) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onDismissNotification: (id: string) => void;
  onSelectEventFromHeader: (event: CalendarEvent) => void;
  onOpenNotificationDate?: (dateKey: string) => void;
}

const DEMO_ROLE_OPTIONS: UserRole[] = [
  'ob',
  'team_lead',
  'faculty',
  'executive',
  'member',
];

export const TopNavBar: React.FC<TopNavBarProps> = ({
  theme,
  palette,
  currentUser,
  onSelectDemoRole,
  onBrandClick,
  onToggleTheme,
  todayEvents,
  clubs,
  announcements,
  dismissedAnnouncementIds,
  onDismissAnnouncement,
  notifications,
  onMarkNotificationRead,
  onDismissNotification,
  onSelectEventFromHeader,
  onOpenNotificationDate,
}) => {
  const [openPopover, setOpenPopover] = useState<'bell' | 'profile' | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isAdmin = canAccessAdminControls(currentUser);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAdmin && openPopover === 'bell') {
      setOpenPopover(null);
    }
  }, [isAdmin, openPopover]);

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncementIds.includes(a.id)
  );
  const unreadNotificationCount =
    notifications.filter((n) => !n.read).length + visibleAnnouncements.length;

  const isDark = theme === 'dark';

  return (
    <header
      ref={headerRef}
      className="relative z-30 flex items-center justify-between gap-4 px-4 sm:px-6 h-[64px] rounded-[18px] border transition-colors duration-150"
      style={{
        background: isDark ? '#171719' : palette.surfaceBackground,
        borderColor: palette.border,
        boxShadow: palette.cardShadow,
      }}
    >
      {/* Left: TechSpace | Calendar Branding */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onBrandClick}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 rounded-lg cursor-pointer"
        >
          <span
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: palette.brandIconBg }}
          >
            <CalendarDays
              className="w-[18px] h-[18px]"
              style={{ color: isDark ? palette.textPrimary : '#FFFFFF' }}
              strokeWidth={2.1}
            />
          </span>
          <span
            className="text-[17px] font-bold tracking-tight whitespace-nowrap"
            style={{ color: palette.textPrimary }}
          >
            TechSpace
          </span>
        </button>

        <span
          className="hidden sm:inline-block h-4 w-px shrink-0"
          style={{ backgroundColor: palette.border }}
          aria-hidden="true"
        />

        <span
          className="hidden sm:inline-block text-[15px] font-semibold whitespace-nowrap"
          style={{ color: palette.brandSubtitle }}
        >
          Calendar
        </span>
      </div>

      {/* Right: Announcements/Notifications (Admin only), Theme Switcher, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'bell' ? null : 'bell')}
            aria-label="Notifications and announcements"
            title="Notifications and announcements"
            className="ts-icon-btn relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{
              color: openPopover === 'bell' ? palette.textPrimary : palette.textMuted,
              backgroundColor: openPopover === 'bell' ? palette.buttonMutedBg : 'transparent',
            }}
          >
            <Bell className="w-[16px] h-[16px]" strokeWidth={1.9} />
            {(unreadNotificationCount > 0 || todayEvents.length > 0) && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: palette.accentBg,
                }}
              />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="ts-btn w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            color: palette.textSecondary,
            backgroundColor: palette.buttonMutedBg,
          }}
        >
          {isDark ? (
            <Sun className="w-[15px] h-[15px]" strokeWidth={2} />
          ) : (
            <Moon className="w-[15px] h-[15px]" strokeWidth={2} />
          )}
        </button>

        <span
          className="hidden sm:inline-block h-5 w-px mx-1"
          style={{ backgroundColor: palette.border }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() => setOpenPopover(openPopover === 'profile' ? null : 'profile')}
          aria-label="Member profile and role preview"
          title={`${currentUser.name} · ${ROLE_LABELS[currentUser.role]}`}
          className="ts-btn w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer"
          style={{
            backgroundColor: palette.buttonMutedBg,
            borderColor: palette.border,
            color: palette.textSecondary,
          }}
        >
          <User className="w-4 h-4" strokeWidth={1.9} />
        </button>
      </div>

      {/* Popover: Notifications, Announcements & Today's Schedule (Admin only) */}
      {isAdmin && openPopover === 'bell' && (
        <div
          className="ts-popover-enter absolute right-4 sm:right-6 top-[72px] w-[320px] max-w-[calc(100vw-2rem)] sm:w-[350px] max-h-[75vh] overflow-y-auto ts-scroll rounded-[16px] border p-3.5 z-50 space-y-3"
          style={{
            backgroundColor: palette.surfaceElevated,
            borderColor: palette.border,
            boxShadow: palette.cardShadow,
          }}
        >
          {/* Section 1: Announcements (distinct card treatment) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[12.5px] font-bold inline-flex items-center gap-1.5"
                style={{ color: palette.textPrimary }}
              >
                <Megaphone className="w-3.5 h-3.5" style={{ color: palette.textMuted }} />
                <span>Announcements</span>
              </span>
              <span className="text-[10.5px]" style={{ color: palette.textMuted }}>
                Local demo
              </span>
            </div>

            {visibleAnnouncements.length === 0 ? (
              <p className="text-[11.5px] py-1.5" style={{ color: palette.textMuted }}>
                No unread announcements.
              </p>
            ) : (
              <div className="space-y-1.5">
                {visibleAnnouncements.slice(0, 4).map((ann) => {
                  const annClub = clubs.find((c) => c.id === ann.clubId);
                  const annTokens = CLUB_THEME_TOKENS[theme][ann.clubId];
                  return (
                    <div
                      key={ann.id}
                      className="p-2.5 rounded-[11px] border"
                      style={{
                        backgroundColor: palette.surfaceSubtle,
                        borderColor: palette.border,
                        borderLeftWidth: '3px',
                        borderLeftColor: annTokens.weekBar,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.06em] uppercase"
                            style={{ color: annTokens.kickerText }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: annTokens.dot }}
                            />
                            <span>{annClub?.shortLabel ?? 'ANNOUNCEMENTS'}</span>
                          </span>
                          <p
                            className="text-[12.5px] font-bold leading-snug mt-0.5"
                            style={{ color: palette.textPrimary }}
                          >
                            {ann.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDismissAnnouncement(ann.id)}
                          aria-label="Dismiss announcement"
                          title="Dismiss locally"
                          className="p-0.5 rounded cursor-pointer shrink-0"
                          style={{ color: palette.textMuted }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p
                        className="text-[11.5px] mt-1 leading-relaxed"
                        style={{ color: palette.textSecondary }}
                      >
                        {ann.content}
                      </p>
                      <p
                        className="text-[10.5px] mt-1.5 tabular-nums"
                        style={{ color: palette.textMuted }}
                      >
                        {ann.publisherName} · {new Date(ann.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Scheduling Alerts & Updates */}
          {notifications.length > 0 && (
            <div className="pt-2.5 border-t" style={{ borderColor: palette.gridLine }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-bold" style={{ color: palette.textPrimary }}>
                  Calendar Alerts
                </span>
                <span className="text-[10.5px]" style={{ color: palette.textMuted }}>
                  {notifications.filter((n) => !n.read).length} unread
                </span>
              </div>
              <div className="space-y-1.5">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-2.5 rounded-[10px] border transition-colors"
                    style={{
                      backgroundColor: notif.read
                        ? 'transparent'
                        : palette.surfaceSubtle,
                      borderColor: palette.border,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (notif.targetDateKey && onOpenNotificationDate) {
                            onOpenNotificationDate(notif.targetDateKey);
                            setOpenPopover(null);
                          }
                        }}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          {notif.kind === 'success' ? (
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: palette.textSecondary }}
                            />
                          ) : (
                            <AlertTriangle
                              className="w-3.5 h-3.5 shrink-0"
                              style={{
                                color:
                                  notif.kind === 'clash'
                                    ? palette.mandatoryBadgeText
                                    : palette.textSecondary,
                              }}
                            />
                          )}
                          <span
                            className="text-[12px] font-semibold truncate"
                            style={{ color: palette.textPrimary }}
                          >
                            {notif.title}
                          </span>
                        </div>
                        <p
                          className="text-[11px] mt-0.5 leading-snug"
                          style={{ color: palette.textMuted }}
                        >
                          {notif.message}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => onMarkNotificationRead(notif.id)}
                            title="Mark as read"
                            className="p-0.5 rounded cursor-pointer"
                            style={{ color: palette.textMuted }}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDismissNotification(notif.id)}
                          title="Dismiss"
                          className="p-0.5 rounded cursor-pointer"
                          style={{ color: palette.textMuted }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Today's Schedule */}
          <div className="pt-2.5 border-t" style={{ borderColor: palette.gridLine }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-bold" style={{ color: palette.textPrimary }}>
                Today&apos;s Schedule
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: palette.textMuted }}>
                {todayEvents.length} {todayEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-[11.5px] py-1" style={{ color: palette.textMuted }}>
                No scheduled club meetings today.
              </p>
            ) : (
              <div className="space-y-1.5">
                {todayEvents.map((ev) => {
                  const clubTokens = CLUB_THEME_TOKENS[theme][ev.clubId];
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        onSelectEventFromHeader(ev);
                        setOpenPopover(null);
                      }}
                      className="w-full text-left p-2.5 rounded-[10px] border transition-colors cursor-pointer"
                      style={{
                        backgroundColor: palette.surfaceSubtle,
                        borderColor: palette.border,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12.5px] font-semibold truncate"
                          style={{ color: palette.textPrimary }}
                        >
                          {ev.title}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: clubTokens.dot }}
                        />
                      </div>
                      <div
                        className="flex items-center gap-3 mt-1 text-[11px] tabular-nums"
                        style={{ color: palette.textMuted }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeRange(ev.startTime, ev.endTime)}
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {ev.location}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popover: Profile + Clearly Marked Demo Role Switcher */}
      {openPopover === 'profile' && (
        <div
          className="ts-popover-enter absolute right-4 sm:right-6 top-[72px] w-[265px] max-w-[calc(100vw-2rem)] rounded-[16px] border p-3.5 z-50"
          style={{
            backgroundColor: palette.surfaceElevated,
            borderColor: palette.border,
            boxShadow: palette.cardShadow,
          }}
        >
          <p className="text-[13.5px] font-bold" style={{ color: palette.textPrimary }}>
            {currentUser.name}
          </p>
          <p className="text-[11.5px] mt-0.5" style={{ color: palette.textMuted }}>
            {ROLE_LABELS[currentUser.role]} · PST
          </p>

          <div
            className="mt-3 pt-2.5 border-t"
            style={{ borderColor: palette.border }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: palette.textMuted }}
            >
              Demo Role Preview (UI Only)
            </p>
            <div className="space-y-1">
              {DEMO_ROLE_OPTIONS.map((roleKey) => {
                const isSelected = currentUser.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => onSelectDemoRole(roleKey)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center justify-between cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? palette.navActiveBg
                        : 'transparent',
                      color: isSelected
                        ? palette.textPrimary
                        : palette.textSecondary,
                    }}
                  >
                    <span>{ROLE_LABELS[roleKey]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-2 leading-snug" style={{ color: palette.textMuted }}>
              Demo permissions only; backend endpoints enforce real authorization.
            </p>
          </div>

          <div
            className="mt-3 pt-2.5 border-t flex items-center justify-between"
            style={{ borderColor: palette.border }}
          >
            <span className="text-[12px]" style={{ color: palette.textSecondary }}>
              Appearance
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="ts-btn text-[12px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
              style={{
                backgroundColor: palette.buttonMutedBg,
                color: palette.textPrimary,
              }}
            >
              {isDark ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
