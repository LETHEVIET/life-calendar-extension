"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2, Smile, Calendar as CalendarIcon } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface EventDate {
  day: number;
  month: string;
  year: number;
}

export interface Event {
  id: string;
  title: string;
  emoji: string;
  repeat: "none" | "weekly" | "monthly";
  date: EventDate;
  endDate?: EventDate | null;
}

interface EventDisplayProps {
  selectedDate: EventDate | null;
  events: Event[];
  filteredEvents: Event[];
  onAddEvent: (event: Omit<Event, "id">) => void;
  onEditEvent: (id: string, updatedEvent: Omit<Event, "id">) => void;
  onDeleteEvent: (id: string) => void;
  months: string[];
}

const EventDisplay = ({
  selectedDate,
  events,
  filteredEvents,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  months
}: EventDisplayProps) => {
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🎯");
  const [repeatOption, setRepeatOption] = useState<"none" | "weekly" | "monthly">("none");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [showEndDate, setShowEndDate] = useState(false);
  const [endCalendarDate, setEndCalendarDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    if (emoji && emoji.native) {
      setSelectedEmoji(emoji.native);
      setIsEmojiPickerOpen(false);
    }
  };

  const dateToObj = (date: Date): EventDate => {
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear()
    };
  };

  const objToDate = (dateObj: EventDate): Date => {
    return new Date(
      dateObj.year,
      months.indexOf(dateObj.month),
      dateObj.day
    );
  };

  const handleAddEvent = () => {
    if (selectedDate && eventTitle.trim()) {
      onAddEvent({
        title: eventTitle,
        emoji: selectedEmoji,
        repeat: repeatOption,
        date: calendarDate ? dateToObj(calendarDate) : selectedDate,
        endDate: showEndDate && endCalendarDate ? dateToObj(endCalendarDate) : null
      });
      resetEventForm();
    }
  };

  const handleEditEvent = () => {
    if (selectedDate && eventTitle.trim() && editingEventId) {
      onEditEvent(editingEventId, {
        title: eventTitle,
        emoji: selectedEmoji,
        repeat: repeatOption,
        date: calendarDate ? dateToObj(calendarDate) : selectedDate,
        endDate: showEndDate && endCalendarDate ? dateToObj(endCalendarDate) : null
      });
      resetEventForm();
    }
  };

  const startEditingEvent = (event: Event) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setSelectedEmoji(event.emoji);
    setRepeatOption(event.repeat);
    setCalendarDate(objToDate(event.date));
    
    if (event.endDate) {
      setShowEndDate(true);
      setEndCalendarDate(objToDate(event.endDate));
    } else {
      setShowEndDate(false);
      setEndCalendarDate(undefined);
    }
    
    setIsAddingNewEvent(false);
  };

  const resetEventForm = () => {
    setIsAddingNewEvent(false);
    setEditingEventId(null);
    setEventTitle("");
    setSelectedEmoji("🎯");
    setRepeatOption("none");
    setCalendarDate(undefined);
    setShowEndDate(false);
    setEndCalendarDate(undefined);
    setIsDatePickerOpen(false);
    setIsEndDatePickerOpen(false);
  };

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {selectedDate 
            ? `Events for ${selectedDate.month} ${selectedDate.day}, ${selectedDate.year}`
            : "Events"}
        </h3>
        {!isAddingNewEvent && !editingEventId && (
          <Button 
            onClick={() => setIsAddingNewEvent(true)}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        )}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="space-y-3 mb-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-lg"
                  role="img"
                  aria-label="Event emoji"
                >
                  {event.emoji}
                </span>
                <div>
                  <span>{event.title}</span>
                  <div className="text-xs text-muted-foreground">
                    {selectedDate && event.date.day === selectedDate.day &&
                     event.date.month === selectedDate.month &&
                     event.date.year === selectedDate.year 
                      ? "Occurs today" 
                      : `Started on ${event.date.month} ${event.date.day}, ${event.date.year}`}
                    
                    {event.repeat !== "none" && (
                      <>, repeats {event.repeat === "weekly" ? "weekly" : "monthly"}</>
                    )}
                    
                    {event.endDate && (
                      <>, until {event.endDate.month} {event.endDate.day}, {event.endDate.year}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditingEvent(event)}
                  aria-label="Edit event"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEvent(event.id)}
                  aria-label="Delete event"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground mb-6">
          No events scheduled for this day.
        </div>
      )}

      {(isAddingNewEvent || editingEventId) ? (
        <div className="space-y-4 bg-background p-4 rounded-md border">
          <h3 className="text-sm font-medium">
            {editingEventId ? "Edit Event" : "Add New Event"}
          </h3>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Emoji</Label>
            <div className="col-span-3 flex items-center gap-2">
              <div className="text-2xl mr-2">{selectedEmoji}</div>
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    <Smile className="h-4 w-4" />
                    <span>Select Emoji</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 border-none shadow-lg" 
                  align="start"
                  side="bottom"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-title" className="text-right">
              Event
            </Label>
            <Input
              id="event-title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="col-span-3"
              placeholder="Enter event title"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {calendarDate ? (
                      format(calendarDate, "PPP")
                    ) : (
                      <span>
                        {selectedDate ? 
                          `${selectedDate.month} ${selectedDate.day}, ${selectedDate.year}` : 
                          "Pick a date"}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={(date) => {
                      setCalendarDate(date);
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Repeat</Label>
            <div className="col-span-3 flex gap-2">
              <Button
                type="button"
                variant={repeatOption === "none" ? "default" : "outline"}
                onClick={() => {
                  setRepeatOption("none");
                  setShowEndDate(false);
                }}
                size="sm"
              >
                None
              </Button>
              <Button
                type="button"
                variant={
                  repeatOption === "weekly" ? "default" : "outline"
                }
                onClick={() => setRepeatOption("weekly")}
                size="sm"
              >
                Weekly
              </Button>
              <Button
                type="button"
                variant={
                  repeatOption === "monthly" ? "default" : "outline"
                }
                onClick={() => setRepeatOption("monthly")}
                size="sm"
              >
                Monthly
              </Button>
            </div>
          </div>

          {repeatOption !== "none" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox
                    id="has-end-date"
                    checked={showEndDate}
                    onCheckedChange={(checked) => setShowEndDate(!!checked)}
                  />
                  <Label htmlFor="has-end-date" className="text-sm font-normal">
                    Set an end date
                  </Label>
                </div>
              </div>

              {showEndDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right"></div>
                  <div className="col-span-3">
                    <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endCalendarDate ? (
                            format(endCalendarDate, "PPP")
                          ) : (
                            <span>Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endCalendarDate}
                          onSelect={(date) => {
                            setEndCalendarDate(date);
                            setIsEndDatePickerOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => {
                            const startDate = calendarDate || (selectedDate ? objToDate(selectedDate) : new Date());
                            return date < startDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetEventForm}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={editingEventId ? handleEditEvent : handleAddEvent}
            >
              {editingEventId ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EventDisplay;
