"use client";

import React, { useMemo, useCallback } from "react";
import { useSharedTooltip } from "./shared-tooltip";
import {
  TooltipProvider,
} from "@/components/ui/tooltip.tsx";

interface LifeCalendarGridProps {
  birthdate: string;
  birthYear: number;
  birthWeek: number;
  lifeExpectancy: number;
  totalWeeks: number[];
  weekYears: number[];
  pastWeeks: number;
  isLoading: boolean;
}

// Calendar utility functions
function getWeeksInYear(year: number) {
  const dec31 = new Date(year, 11, 31);
  const week = getISOWeek(dec31);
  return week === 1 ? 52 : week;
}

function getISOWeek(date: Date) {
  const dt = new Date(date.getTime());
  const dayn = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dayn + 3);
  const firstThursday = dt.getTime();
  dt.setMonth(0, 1);
  if (dt.getDay() !== 4) {
    dt.setMonth(0, 1 + ((4 - dt.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - dt) / 604800000);
}

function LifeCalendarGrid({
  birthdate,
  birthYear,
  birthWeek,
  lifeExpectancy,
  totalWeeks,
  weekYears,
  pastWeeks,
  isLoading,
}: LifeCalendarGridProps) {
  const { showTooltip, hideTooltip } = useSharedTooltip();

  // Memoize the years array calculation
  const years = useMemo(() => {
    if (!birthdate && !isLoading) return [];
    const birthYear = birthdate
      ? new Date(birthdate).getFullYear()
      : new Date().getFullYear() - 40;
    const endYear = birthYear + lifeExpectancy + 1;
    return Array.from({ length: endYear - birthYear }, (_, i) => birthYear + i);
  }, [birthdate, lifeExpectancy, isLoading]);

  // Event delegation handlers
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (isLoading) return;
    
    // Only process events from the week dots
    const target = e.target as HTMLElement;
    if (!target.classList.contains('week-dot')) return;
    
    const yearIndex = parseInt(target.dataset.yearIndex || '0', 10);
    const weekIndex = parseInt(target.dataset.weekIndex || '0', 10);
    const year = years[yearIndex];
    
    showTooltip(`Week ${weekIndex + 1} of ${year}`, target);
  }, [isLoading, showTooltip, years]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('week-dot')) {
      hideTooltip();
    }
  }, [hideTooltip]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 mb-8 overflow-x-auto">
        <div 
          className="flex flex-wrap justify-center gap-1"
          onMouseOver={handleMouseEnter}
          onMouseOut={handleMouseLeave}
        >
          {years.map((year, yearIndex) => (
            <div key={year} className="flex flex-col items-center mb-1 mx-1">
              <div className="text-xs font-medium mb-1">{year}</div>
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] grid-flow-row-dense gap-[2px]">
                {Array.from(
                  { length: weekYears.length ? weekYears[yearIndex] : 53 },
                  (_, weekIndex) => {
                    const weekNumber = totalWeeks[yearIndex] + weekIndex;
                    const isPast = !isLoading && weekNumber < pastWeeks;
                    const notUseWeeks =  birthYear === year && (weekIndex < birthWeek);
                    return (
                      <div
                        key={weekIndex}
                        className={`w-1.5 h-1.5 rounded-full week-dot ${
                          isLoading
                            ? "bg-secondary"
                            : 
                            notUseWeeks
                            ?"bg-secondary"
                            : isPast
                              ? "bg-primary"
                              : "bg-secondary"
                        }`}
                        data-year-index={yearIndex}
                        data-week-index={weekIndex}
                      />
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default React.memo(LifeCalendarGrid);
