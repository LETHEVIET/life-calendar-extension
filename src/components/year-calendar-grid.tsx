"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import React from "react";

interface YearCalendarGridProps {
  birthdate: string;
  isLoading: boolean;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year, month) {
  // JavaScript months are 0-based, so January is 0, February is 1, etc.
  return new Date(year, month + 1, 0).getDate();
}

function YearCalendarGrid({ birthdate, isLoading }: YearCalendarGridProps) {
  const now = new Date();

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 mb-8 overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-1">
          <div className="flex flex-col items-end mb-1 mx-1">
            <div className="text-xs font-medium mb-1 w-full text-right">{">"}</div>
            {days.map((day) => (
              <div key={day} className="text-xs font-medium h-3 flex items-center justify-end mb-[2px] w-full">
              {day}
              </div>
            ))}
          </div>
          {months.map((month, monthIndex) => (
            <div key={month} className="flex flex-col items-center mb-1 mx-1">
              <div className="text-xs font-medium mb-1">{month}</div>
              <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
                {/* If you need to keep the function, use IIFE: */}
                {(() => {
                  const firstDayOfMonth = new Date(now.getFullYear(), monthIndex, 1);
                  const dayName = firstDayOfMonth.toLocaleDateString('en-US', { weekday: 'short' });

                  const notUseDays = days.indexOf(dayName);

                  return Array.from({ length: notUseDays }, (_, dayIndex) => (
                    <div key={dayIndex} className="w-3 h-3 rounded-full bg-secondary" />
                  ));
                })()}
                {Array.from(
                  { length: getDaysInMonth(now.getFullYear(), monthIndex) },
                  (_, dayIndex) => {
                    const dayNumber = now.getDay();
                    const isPast = !(
                      now.getMonth() < monthIndex ||
                      (now.getMonth() === monthIndex && dayNumber <= dayIndex)
                    );
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              // notUsed
                              //   ? "bg-gray-200" // Skeleton placeholder
                                isPast
                                ? "bg-primary"
                                : "bg-gray-200"
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {`Day ${dayIndex + 1} of ${month}`}
                        </TooltipContent>
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

export default React.memo(YearCalendarGrid);
