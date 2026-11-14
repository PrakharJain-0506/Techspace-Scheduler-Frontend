import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Network,
  MoreHorizontal,
} from 'lucide-react';
import { NavSection, ThemeMode } from '../types/calendar';
import { ThemePalette } from '../theme/calendarTheme';

interface NavRailProps {
  theme: ThemeMode;
  palette: ThemePalette;
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  onOpenMore: () => void;
}

const RAIL_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'meets', label: 'All Meets', icon: ClipboardList },
  { id: 'hierarchy', label: 'Hierarchy', icon: Network },
];

export const NavRail: React.FC<NavRailProps> = ({
  theme,
  palette,
  activeNav,
  onSelectNav,
  onOpenMore,
}) => {
  const isDark = theme === 'dark';

  return (
    <>
      {/* Desktop Permanent 60px Navigation Rail */}
      <nav
        aria-label="Primary navigation rail"
        className="hidden md:flex w-[60px] shrink-0 flex-col items-center justify-between py-3 px-1.5 rounded-[20px] border ts-transition"
        style={{
          background: palette.surfaceBackground,
          borderColor: palette.border,
          boxShadow: palette.cardShadow,
        }}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          {RAIL_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group w-11 h-11 rounded-[12px] flex items-center justify-center transition-all duration-200 cursor-pointer border border-transparent ${
                  isActive
                    ? ''
                    : isDark
                      ? 'hover:bg-white/[0.05]'
                      : 'hover:bg-black/[0.04]'
                }`}
                style={{
                  backgroundColor: isActive ? palette.navActiveBg : 'transparent',
                  color: isActive ? palette.brandSubtitle : palette.textMuted,
                }}
              >
                <Icon
                  className="w-[19px] h-[19px] transition-transform duration-150 group-hover:scale-[1.06]"
                  strokeWidth={isActive ? 2.1 : 1.85}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenMore}
          title="More navigation"
          aria-label="More navigation"
          className={`ts-icon-btn w-11 h-11 rounded-[12px] flex items-center justify-center cursor-pointer border border-transparent ${
            isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.045]'
          }`}
          style={{
            backgroundColor: palette.buttonMutedBg,
            color: palette.textSecondary,
          }}
        >
          <MoreHorizontal className="w-[19px] h-[19px]" strokeWidth={1.9} />
        </button>
      </nav>

      {/* Mobile Compact Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden flex items-center justify-between gap-1 px-1.5 py-1.5 rounded-[16px] border w-full overflow-hidden"
        style={{
          background: palette.surfaceBackground,
          borderColor: palette.border,
          boxShadow: palette.cardShadow,
        }}
      >
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-[10px] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-[10.5px] sm:text-[12px] font-semibold leading-tight transition-colors duration-200 cursor-pointer ${
                isActive ? '' : isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.035]'
              }`}
              style={{
                backgroundColor: isActive ? palette.navActiveBg : 'transparent',
                color: isActive ? palette.brandSubtitle : palette.textMuted,
              }}
            >
              <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="More navigation"
          className="ts-icon-btn shrink-0 py-1.5 px-2 sm:px-2.5 rounded-[10px] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10.5px] sm:text-[12px] font-medium leading-tight cursor-pointer"
          style={{ color: palette.textMuted }}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="sm:hidden">More</span>
        </button>
      </nav>
    </>
  );
};
