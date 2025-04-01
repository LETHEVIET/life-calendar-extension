"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { SearchBar } from "./search-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import LifeCalendarGrid from "./life-calendar-grid";
import YearCalendarGrid from "./year-calendar-grid";
import EventDisplay, { Event, EventDate } from "./event-display";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UseAnimations from "react-useanimations";
import loading from "react-useanimations/lib/loading";

import { SettingsIcon } from "./ui/settings.tsx";

// import { Settings, Sparkle } from "lucide-react";
import { SparklesIcon } from "./ui/sparkles.tsx";

import { Switch } from "@/components/ui/switch.tsx";
import { SharedTooltipProvider } from "./shared-tooltip";
import { ModeToggle } from "./mode-toggle.tsx";

import storageManager from "../utils/storageManager";
import { LoaderPinwheelIcon } from "./ui/loader-pinwheel.tsx";

function getISOWeek(date) {
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

// Calculate weeks in a given year
function getWeeksInYear(year) {
  const dec31 = new Date(year, 11, 31);
  const week = getISOWeek(dec31);
  return week === 1 ? 52 : week;
}

function getWeekNumber(date = new Date()) {
  // Copy date so don't modify original
  date = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  // Return array of year and week number
  return weekNo;
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

export default function Calendars() {
  const [name, setName] = useState("Your Name");
  const [birthdate, setBirthdate] = useState("");
  const [lifeExpectancy, setLifeExpectancy] = useState(80);
  const [weeksRemaining, setWeeksRemaining] = useState(0);
  const [pastWeeks, setPastWeeks] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState([]);
  const [weekYears, setWeekYears] = useState([]);
  const [inspiration, setInspiration] = useState(
    "How are you going to spend these weeks?"
  );
  const [birthYear, setBirthYear] = useState(0);
  const [birthWeek, setBirthWeek] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("life");
  const [daysRemainingInYear, setDaysRemainingInYear] = useState(0);
  const [useRandomAdvice, setUseRandomAdvice] = useState(false);
  const [randomAdvice, setRandomAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  // Add local form state variables
  const [formName, setFormName] = useState("");
  const [formBirthdate, setFormBirthdate] = useState("");
  const [formLifeExpectancy, setFormLifeExpectancy] = useState(80);
  const [formInspiration, setFormInspiration] = useState("");
  const [formUseRandomAdvice, setFormUseRandomAdvice] = useState(false);

  // Event handling state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<EventDate | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  // Convert between Date objects and our date structure
  const dateToObj = (date: Date): EventDate => {
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
    };
  };

  const objToDate = (dateObj: EventDate): Date => {
    return new Date(
      dateObj.year,
      months.indexOf(dateObj.month),
      dateObj.day
    );
  };

  // Initialize selected date as today's date
  useEffect(() => {
    const today = new Date();
    setSelectedDate(dateToObj(today));
  }, []);

  // Load events from storage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEvents = await storageManager.get("life-calendar-events");
        let parsedEvents = [];
        
        if (savedEvents) {
          parsedEvents = JSON.parse(savedEvents);
          if (!Array.isArray(parsedEvents)) parsedEvents = [];
        }
        
        // Check if we need to add/update birthday event
        if (birthdate) {
          const birthdayDate = new Date(birthdate);
          const birthdayEvent: Event = {
            id: "birthday-special-event",
            title: `${name}'s Birthday`,
            description: "Your birthday celebration!",
            date: {
              day: birthdayDate.getDate(),
              month: months[birthdayDate.getMonth()],
              year: birthdayDate.getFullYear()
            },
            repeat: "yearly",
            category: "birthday",
            color: "#FFD700" // Gold color for birthday
          };
          
          // Remove existing birthday event if present
          parsedEvents = parsedEvents.filter(event => event.id !== "birthday-special-event");
          
          // Add the birthday event
          parsedEvents.push(birthdayEvent);
        }
        
        setEvents(parsedEvents);
      } catch (e) {
        console.error("Failed to load events:", e);
        setEvents([]);
      }
    };
    
    loadEvents();
  }, [birthdate, name, months]);

  // Save events to storage whenever they change
  useEffect(() => {
    if (events.length > 0) { // Also save when clearing all events
      try {
        const eventsJson = JSON.stringify(events);
        storageManager.set("life-calendar-events", eventsJson);
      } catch (e) {
        console.error("Failed to save events:", e);
      }
    }
  }, [events]);

  // Filter events for the selected date, including repeating events
  useEffect(() => {
    if (!selectedDate) {
      setFilteredEvents([]);
      return;
    }

    const filtered = events.filter((event) => {
      // Direct date match
      if (
        event.date.day === selectedDate.day &&
        event.date.month === selectedDate.month &&
        event.date.year === selectedDate.year
      ) {
        return true;
      }

      // If event has an end date, check if the selected date is after it
      if (event.endDate) {
        const selectedDateObj = objToDate(selectedDate);
        const endDateObj = objToDate(event.endDate);

        if (selectedDateObj > endDateObj) {
          return false;
        }
      }

      // Weekly repeat - same day of week
      if (event.repeat === "weekly") {
        const eventDate = objToDate(event.date);
        const currentDate = objToDate(selectedDate);

        return (
          eventDate.getDay() === currentDate.getDay() &&
          currentDate >= eventDate
        );
      }

      // Monthly repeat - same day of month
      if (event.repeat === "monthly") {
        return (
          event.date.day === selectedDate.day &&
          (selectedDate.year > event.date.year ||
            (selectedDate.year === event.date.year &&
              months.indexOf(selectedDate.month) >=
                months.indexOf(event.date.month)))
        );
      }
      
      // Yearly repeat - same day and month (for birthdays)
      if (event.repeat === "yearly") {
        return (
          event.date.day === selectedDate.day &&
          event.date.month === selectedDate.month &&
          selectedDate.year >= event.date.year
        );
      }

      return false;
    });

    setFilteredEvents(filtered);
  }, [selectedDate, events]);

  // Handler for adding a new event
  const handleAddEvent = (newEvent: Omit<Event, "id">) => {
    const eventWithId: Event = {
      ...newEvent,
      id: Date.now().toString(),
    };
    setEvents([...events, eventWithId]);
  };

  // Handler for editing an event
  const handleEditEvent = (id: string, updatedEvent: Omit<Event, "id">) => {
    setEvents(
      events.map((event) =>
        event.id === id ? { ...updatedEvent, id } : event
      )
    );
  };

  // Handler for deleting an event
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id));
  };

  // Handler for date selection from the calendar
  const handleSelectDate = (date: EventDate) => {
    setSelectedDate(date);
  };

  // Fetch random advice from API
  const fetchRandomAdvice = async () => {
    setAdviceLoading(true);
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      const data = await response.json();
      setRandomAdvice(data.slip.advice);
      console.log("Fetched advice:", data.slip.advice);
    } catch (error) {
      console.error("Failed to fetch advice:", error);
      setRandomAdvice("Make the most of your time today."); // Fallback message
    } finally {
      setAdviceLoading(false);
    }
  };

  // Modify to only fetch once when enabled, not on every tab change
  useEffect(() => {
    if (useRandomAdvice) {
      // Only fetch if we don't already have advice
      if (!randomAdvice) {
        fetchRandomAdvice();
      }

      // Refresh advice every 3 hours
      const adviceInterval = setInterval(fetchRandomAdvice, 3 * 60 * 60 * 1000);
      return () => clearInterval(adviceInterval);
    }
  }, [useRandomAdvice, randomAdvice]); // Remove activeTab dependency

  // Calculate days remaining in the current year
  useEffect(() => {
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31
    const diffTime = Math.abs(endOfYear - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemainingInYear(diffDays);
  }, []);

  // Load saved tab preference and user settings
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["activeTab", "useRandomAdvice"], (result) => {
        if (result.activeTab) {
          setActiveTab(result.activeTab);
        }
        if (result.useRandomAdvice !== undefined) {
          setUseRandomAdvice(result.useRandomAdvice);
        }
      });
    } else {
      const savedTab = localStorage.getItem("life-calendar-activeTab");
      if (savedTab) {
        setActiveTab(savedTab);
      }

      const savedRandomAdvice = localStorage.getItem(
        "life-calendar-useRandomAdvice"
      );
      if (savedRandomAdvice !== null) {
        setUseRandomAdvice(savedRandomAdvice === "true");
      }
    }
  }, []);

  // Save tab selection when it changes - don't fetch advice here
  const handleTabChange = (value) => {
    setActiveTab(value);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ activeTab: value });
    } else {
      localStorage.setItem("life-calendar-activeTab", value);
    }
  };

  // Store the random advice in storage to make it persistent
  useEffect(() => {
    // Only save when we have advice and are using random advice
    if (randomAdvice && useRandomAdvice) {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ randomAdvice });
      } else {
        localStorage.setItem("life-calendar-randomAdvice", randomAdvice);
      }
    }
  }, [randomAdvice, useRandomAdvice]);

  // Calculate weeks based on birthdate and life expectancy
  useEffect(() => {
    const weekStartTime = performance.now();
    if (!birthdate) return;

    const birthDate = new Date(birthdate);
    const today = new Date();

    let totalWeeks = 0;
    let weekYears = [];

    let totalWeeksList = [0];
    let pastWeeks = 0;

    setBirthYear(birthDate.getFullYear());
    setBirthWeek(getWeekNumber(birthDate));

    for (
      let year = birthDate.getFullYear();
      year <= birthDate.getFullYear() + lifeExpectancy;
      year++
    ) {
      const numberWeekOfYear = getWeeksInYear(year);
      weekYears.push(numberWeekOfYear);
      if (year === today.getFullYear()) {
        const weekNumber = getWeekNumber(today);
        pastWeeks = totalWeeks + weekNumber;
        setPastWeeks(pastWeeks);
        totalWeeks += numberWeekOfYear - weekNumber;
      } else {
        totalWeeks += numberWeekOfYear;
      }

      totalWeeksList.push(totalWeeks);
    }

    setTotalWeeks(totalWeeksList);
    setWeeksRemaining(totalWeeks - pastWeeks - 1 - getWeekNumber(birthDate));
    setWeekYears(weekYears);

    console.log(
      "Week process time:",
      (performance.now() - weekStartTime).toFixed(2),
      "s"
    );
  }, [birthdate, lifeExpectancy]);

  // Fetch data on mount
  useEffect(() => {
    setIsLoading(true);

    // Check if we're running as an extension
    const isExtension =
      typeof chrome !== "undefined" && chrome.storage !== undefined;

    if (isExtension) {
      // Use storage manager for consistent API
      const loadData = async () => {
        try {
          // Get all data at once
          const name = await storageManager.get("life-calendar-name", "");
          const birthdate = await storageManager.get("life-calendar-birthdate", "");
          const lifeExpectancy = await storageManager.get("life-calendar-life-expectancy", 80);
          const inspiration = await storageManager.get("life-calendar-inspiration", "How are you going to spend these weeks?");
          const useRandomAdvice = await storageManager.get("life-calendar-use-random-advice", false);

          // Process the values
          if (name) setName(name);
          if (birthdate) setBirthdate(birthdate);
          if (lifeExpectancy) setLifeExpectancy(lifeExpectancy);
          if (inspiration) setInspiration(inspiration);
          if (useRandomAdvice !== undefined) setUseRandomAdvice(useRandomAdvice);

          setIsLoading(false);
          if (!birthdate) setIsDialogOpen(true);
        } catch (error) {
          console.error("Error loading calendar data:", error);
          setIsLoading(false);
          setIsDialogOpen(true);
        }
      };

      loadData();
    } else {
      // For non-extension environments, still use storage manager
      // (it will use localStorage automatically)
      const loadData = async () => {
        try {
          const name = await storageManager.get("life-calendar-name", "");
          const birthdate = await storageManager.get("life-calendar-birthdate", "");
          const lifeExpectancy = await storageManager.get("life-calendar-life-expectancy", 80);
          const inspiration = await storageManager.get("life-calendar-inspiration", "How are you going to spend these weeks?");
          const useRandomAdvice = await storageManager.get("life-calendar-use-random-advice", false);

          if (name) setName(name);
          if (birthdate) setBirthdate(birthdate);
          if (lifeExpectancy) setLifeExpectancy(lifeExpectancy);
          if (inspiration) setInspiration(inspiration);
          if (useRandomAdvice !== undefined) setUseRandomAdvice(useRandomAdvice);

          setIsLoading(false);
          if (!birthdate) setIsDialogOpen(true);
        } catch (error) {
          console.error("Error loading calendar data:", error);
          setIsLoading(false);
          setIsDialogOpen(true);
        }
      };

      loadData();
    }
  }, []);

  // Update useEffect to initialize form state when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setFormName(name);
      setFormBirthdate(birthdate);
      setFormLifeExpectancy(lifeExpectancy);
      setFormInspiration(inspiration);
      setFormUseRandomAdvice(useRandomAdvice);
    }
  }, [
    isDialogOpen,
    name,
    birthdate,
    lifeExpectancy,
    inspiration,
    useRandomAdvice,
  ]);

  // Modify handleSubmit to use form state
  const handleSubmit = (e) => {
    e.preventDefault();
    // Update main state with form values
    setName(formName);
    setBirthdate(formBirthdate);
    setLifeExpectancy(formLifeExpectancy);
    setInspiration(formInspiration);
    setUseRandomAdvice(formUseRandomAdvice);

    // Use storage manager to save all values
    storageManager.set("life-calendar-name", formName);
    storageManager.set("life-calendar-birthdate", formBirthdate);
    storageManager.set("life-calendar-life-expectancy", formLifeExpectancy);
    storageManager.set("life-calendar-inspiration", formInspiration);
    storageManager.set("life-calendar-use-random-advice", formUseRandomAdvice);
    
    console.log("Settings saved");
    setIsDialogOpen(false);

    // Fetch new advice if switching to random mode
    if (formUseRandomAdvice && !useRandomAdvice) {
      fetchRandomAdvice();
    }
  };

  // Update handlers to use storage manager
  const handleNameChange = (value: string) => {
    setName(value);
    storageManager.set("life-calendar-name", value);
  };

  const handleBirthdateChange = (value: string) => {
    setBirthdate(value);
    storageManager.set("life-calendar-birthdate", value);
  };

  const handleLifeExpectancyChange = (value: number) => {
    setLifeExpectancy(value);
    storageManager.set("life-calendar-life-expectancy", value);
  };

  const handleInspirationChange = (value: string) => {
    setInspiration(value);
    storageManager.set("life-calendar-inspiration", value);
  };

  const handleUseRandomAdviceChange = (checked: boolean) => {
    setUseRandomAdvice(checked);
    storageManager.set("life-calendar-use-random-advice", checked);
  };

  // Get fresh advice
  const handleRefreshAdvice = () => {
    console.log("Refreshing advice...");
    fetchRandomAdvice();
  };

  // Header text based on active tab
  const getHeaderText = () => {
    if (activeTab === "life") {
      return `${name}, only ${weeksRemaining.toLocaleString()} Sundays remain`;
    } else {
      return `${name}, only ${daysRemainingInYear} days left in this year`;
    }
  };

  // Subheader text based on active tab
  const getSubheaderText = () => {
    if (activeTab === "life") {
      return "Each circle represents one week of your life";
    } else {
      return "Each circle represents one day of this year";
    }
  };

  // Display the right inspirational message
  const getInspirationMessage = () => {
    return randomAdvice || "";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SharedTooltipProvider>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-screen absolute inset-0 m-auto">
            <i>Loading...</i>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{getHeaderText()}</h1>
            </div>

            <Tabs
              defaultValue={activeTab}
              className=""
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-2 max-w-3xs mx-auto mb-2">
                <TabsTrigger value="year">Year</TabsTrigger>
                <TabsTrigger value="life">Life</TabsTrigger>
              </TabsList>

              <p className="text-lg text-gray-600 dark:text-gray-300">
                {getSubheaderText()}
              </p>
              <TabsContent
                value="life"
                forceMount
                className="hidden data-[state=active]:block"
              >
                <LifeCalendarGrid
                  birthdate={birthdate}
                  birthYear={birthYear}
                  birthWeek={birthWeek}
                  lifeExpectancy={lifeExpectancy}
                  totalWeeks={totalWeeks}
                  weekYears={weekYears}
                  pastWeeks={pastWeeks}
                  isLoading={isLoading}
                />
              </TabsContent>
              <TabsContent
                value="year"
                forceMount
                className="hidden data-[state=active]:block"
              >
                <div className="grid grid-cols-1 gap-6">
                  <YearCalendarGrid
                    birthdate={birthdate}
                    isLoading={isLoading}
                    events={events}
                    months={months}
                    onSelectDate={handleSelectDate}
                    selectedDate={selectedDate}
                  />

                  <EventDisplay
                    selectedDate={selectedDate}
                    events={events}
                    filteredEvents={filteredEvents}
                    onAddEvent={handleAddEvent}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                    months={months}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="text-center mb-12">
              <div className="flex justify-center items-center mb-4">
                <h2 className="text-2xl font-bold">
                  <i>{getInspirationMessage()}</i>
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={handleRefreshAdvice}
                  disabled={adviceLoading}
                >
                  {adviceLoading ? (
                    // <UseAnimations className="bg-primary" animation={loading} size={24} />
                    <LoaderPinwheelIcon />
                  ) : (
                    <SparklesIcon />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SharedTooltipProvider>

      <div className="fixed bottom-0 left-0 m-4 flex flex-col gap-2 items-center justify-center">
        <ModeToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsDialogOpen(true)}
        >
          {/* <Settings className="h-6 w-6" /> */}
          <SettingsIcon className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Life Calendar</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthdate">Birth Date</Label>
              <Input
                id="birthdate"
                type="date"
                value={formBirthdate}
                onChange={(e) => setFormBirthdate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lifeExpectancy">Life Expectancy (years)</Label>
              <Input
                id="lifeExpectancy"
                type="number"
                min="1"
                max="120"
                value={formLifeExpectancy}
                onChange={(e) =>
                  setFormLifeExpectancy(Number.parseInt(e.target.value))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="random-advice">Use Random Advice</Label>
              <Switch
                id="random-advice"
                checked={formUseRandomAdvice}
                onCheckedChange={setFormUseRandomAdvice}
              />
            </div>

            {!formUseRandomAdvice && (
              <div className="grid gap-2">
                <Label htmlFor="inspiration">Custom Inspiration Message</Label>
                <Input
                  id="inspiration"
                  value={formInspiration}
                  onChange={(e) => setFormInspiration(e.target.value)}
                  placeholder="Enter an inspirational message"
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
