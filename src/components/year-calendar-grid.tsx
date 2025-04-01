"use client";

import React from "react";
import { useSharedTooltip } from "./shared-tooltip";
import { Event, EventDate } from "./event-display";

interface YearCalendarGridProps {
  birthdate: string;
  isLoading: boolean;
  events: Event[];
  months: string[];
  onSelectDate: (date: EventDate) => void;
  selectedDate: EventDate | null;
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function YearCalendarGrid({ 
  birthdate, 
  isLoading, 
  events, 
  months,
  onSelectDate,
  selectedDate
}: YearCalendarGridProps) {
  const now = new Date();
  const { showTooltip, hideTooltip } = useSharedTooltip();

  const objToDate = (dateObj: EventDate): Date => {
    return new Date(
      dateObj.year,
      months.indexOf(dateObj.month),
      dateObj.day
    );
  };

  const isDateInEventPeriod = (checkDate: EventDate, event: Event) => {
    const checkDateObj = objToDate(checkDate);
    const eventStartObj = objToDate(event.date);
    
    if (checkDateObj < eventStartObj) {
      return false;
    }
    
    if (event.endDate) {
      const eventEndObj = objToDate(event.endDate);
      if (checkDateObj > eventEndObj) {
        return false;
      }
    }
    
    return true;
  };

  const getFirstEventEmoji = (day: number, month: string, year: number) => {
    const checkDate = { day, month, year };
    const dateEvents = events.filter((event) => {
      if (
        event.date.day === day &&
        event.date.month === month &&
        event.date.year === year
      ) {
        return true;
      }

      if (!isDateInEventPeriod(checkDate, event)) {
        return false;
      }

      if (event.repeat === "weekly") {
        const eventDate = objToDate(event.date);
        const checkDateObj = objToDate(checkDate);
        
        return eventDate.getDay() === checkDateObj.getDay();
      }

      if (event.repeat === "monthly") {
        return event.date.day === day;
      }

      return false;
    });

    return dateEvents.length > 0 ? dateEvents[0].emoji : null;
  };

  const getDateEvents = (day: number, month: string, year: number) => {
    const checkDate = { day, month, year };
    return events.filter((event) => {
      if (
        event.date.day === day &&
        event.date.month === month &&
        event.date.year === year
      ) {
        return true;
      }

      if (!isDateInEventPeriod(checkDate, event)) {
        return false;
      }

      if (event.repeat === "weekly") {
        const eventDate = objToDate(event.date);
        const checkDateObj = objToDate(checkDate);
        
        return eventDate.getDay() === checkDateObj.getDay();
      }

      if (event.repeat === "monthly") {
        return event.date.day === day;
      }

      return false;
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap justify-center gap-1">
        <div className="flex flex-col items-end mb-1 mx-1">
          <div className="text-xs font-medium mb-1 w-full text-right opacity-0">{">"}</div>
          {days.map((day) => (
            <div
              key={day}
              className="text-xs font-medium h-3 flex items-center justify-end mb-[2px] w-full"
            >
              {day}
            </div>
          ))}
        </div>
        {months.map((month, monthIndex) => (
          <div key={month} className="flex flex-col items-center mb-1 mx-1">
            <div className="text-xs font-medium mb-1">{month}</div>
            <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
              {(() => {
                const firstDayOfMonth = new Date(
                  now.getFullYear(),
                  monthIndex,
                  1
                );
                const dayName = firstDayOfMonth.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                const notUseDays = days.indexOf(dayName);

                return Array.from({ length: notUseDays }, (_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-3 h-3 rounded-full opacity-0"
                  />
                ));
              })()}
              {Array.from(
                { length: getDaysInMonth(now.getFullYear(), monthIndex) },
                (_, dayIndex) => {
                  const dayNumber = now.getDate();
                  const isPast = !(
                    now.getMonth() < monthIndex ||
                    (now.getMonth() === monthIndex && dayNumber <= dayIndex)
                  );

                  const day = dayIndex + 1;
                  const dayEvents = getDateEvents(day, month, now.getFullYear());
                  const hasEvents = dayEvents.length > 0;
                  const firstEventEmoji = getFirstEventEmoji(day, month, now.getFullYear());
                  
                  const isToday = now.getDate() === day && now.getMonth() === monthIndex;

                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 flex items-center justify-center rounded-full cursor-pointer ${
                        isPast ? "bg-primary" : "bg-secondary"
                      } ${hasEvents && !firstEventEmoji ? "ring-2 ring-blue-500" : ""} ${
                        selectedDate?.day === day && 
                        selectedDate?.month === month && 
                        selectedDate?.year === now.getFullYear() 
                          ? "ring-2 ring-orange-500" : ""
                      } ${
                        isToday ? "ring-2 ring-green-500" : ""
                      }`}
                      onClick={() => {
                        onSelectDate({
                          day: dayIndex + 1,
                          month: month,
                          year: now.getFullYear(),
                        });
                      }}
                      onMouseEnter={(e) =>
                        showTooltip(
                          <div>
                            <div className="font-medium">{`${month} ${dayIndex + 1}`}</div>
                            {hasEvents ? (
                              <div className="mt-1 text-xs space-y-1">
                                {dayEvents.length > 0 && (
                                  <div className="font-medium">Events:</div>
                                )}
                                {dayEvents.slice(0, 3).map((event, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span>{event.emoji}</span>
                                    <span>{event.title}</span>
                                  </div>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-blue-500">{`+${dayEvents.length - 3} more`}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-1">
                                No events
                              </div>
                            )}
                          </div>,
                          e.currentTarget
                        )
                      }
                      onMouseLeave={() => hideTooltip()}
                    >
                      {firstEventEmoji && (
                        <span className="leading-none">{firstEventEmoji}</span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(YearCalendarGrid);
