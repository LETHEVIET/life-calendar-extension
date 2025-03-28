"use client";

import React, { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  // Memoize the years array calculation
  const years = useMemo(() => {
    if (!birthdate && !isLoading) return [];
    const birthYear = birthdate
      ? new Date(birthdate).getFullYear()
      : new Date().getFullYear() - 40;
    const endYear = birthYear + lifeExpectancy + 1;
    return Array.from({ length: endYear - birthYear }, (_, i) => birthYear + i);
  }, [birthdate, lifeExpectancy, isLoading]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 mb-8 overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-1">
          {years.map((year, yearIndex) => (
            <div key={year} className="flex flex-col items-center mb-1 mx-1">
              <div className="text-xs font-medium mb-1">{year}</div>
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] grid-flow-row-dense gap-[2px]">
                {Array.from(
                  { length: weekYears.length ? weekYears[yearIndex] : 53 },
                  (_, weekIndex) => {
                    const weekNumber = totalWeeks[yearIndex] + weekIndex;
                    const isPast = !isLoading && weekNumber < pastWeeks && (birthYear === year ? weekIndex > birthWeek : true);
                    return (
                      <Tooltip key={weekIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLoading
                                ? "bg-secondary" // Skeleton placeholder
                                : isPast
                                ? "bg-primary"
                                : "bg-gray-200"
                            }`}
                          />
                        </TooltipTrigger>
                        {!isLoading && (
                          <TooltipContent>
                            {`Week ${weekIndex + 1} of ${year}`}
                          </TooltipContent>
                        )}
                      </Tooltip>
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
