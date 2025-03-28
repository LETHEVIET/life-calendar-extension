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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

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
  const [isLoading, setIsLoading] = useState(true); // New loading state

  // Add local form state variables
  const [formName, setFormName] = useState("");
  const [formBirthdate, setFormBirthdate] = useState("");
  const [formLifeExpectancy, setFormLifeExpectancy] = useState(80);
  const [formInspiration, setFormInspiration] = useState("");

  
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
    setWeeksRemaining(totalWeeks - pastWeeks - 1);
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

    if (typeof chrome !== "undefined" && chrome.storage) {
      console.time("chrome-storage-total");
      const startTime = performance.now();

      chrome.storage.local.get(
        ["name", "birthdate", "lifeExpectancy", "inspiration"],
        (result) => {
          const fetchTime = performance.now() - startTime;
          console.log("Chrome storage fetch time:", fetchTime.toFixed(2), "ms");

          // Log size and value for each item
          console.log(
            "Name:",
            result.name,
            result.name
              ? `(${JSON.stringify(result.name).length} bytes)`
              : "(not found)"
          );
          console.log(
            "Birthdate:",
            result.birthdate,
            result.birthdate
              ? `(${JSON.stringify(result.birthdate).length} bytes)`
              : "(not found)"
          );
          console.log(
            "LifeExpectancy:",
            result.lifeExpectancy,
            result.lifeExpectancy
              ? `(${JSON.stringify(result.lifeExpectancy).length} bytes)`
              : "(not found)"
          );
          console.log(
            "Inspiration:",
            result.inspiration,
            result.inspiration
              ? `(${JSON.stringify(result.inspiration).length} bytes)`
              : "(not found)"
          );

          // Process the values
          const processStartTime = performance.now();
          if (result.name) setName(result.name);
          if (result.birthdate) setBirthdate(result.birthdate);
          if (result.lifeExpectancy) setLifeExpectancy(result.lifeExpectancy);
          if (result.inspiration) setInspiration(result.inspiration);
          console.log(
            "Chrome storage process time:",
            (performance.now() - processStartTime).toFixed(2),
            "ms"
          );

          console.timeEnd("chrome-storage-total");

          setIsLoading(false);
          if (!result.birthdate) setIsDialogOpen(true);
        }
      );
    } else {
      console.time("localStorage-total");

      // Measure individual localStorage items
      const nameStartTime = performance.now();
      const savedName = localStorage.getItem("life-calendar-name");
      console.log(
        "localStorage name fetch time:",
        (performance.now() - nameStartTime).toFixed(2),
        "ms",
        savedName ? `(${savedName.length} bytes)` : "(not found)"
      );

      const birthdateStartTime = performance.now();
      const savedBirthdate = localStorage.getItem("life-calendar-birthdate");
      console.log(
        "localStorage birthdate fetch time:",
        (performance.now() - birthdateStartTime).toFixed(2),
        "ms",
        savedBirthdate ? `(${savedBirthdate.length} bytes)` : "(not found)"
      );

      const lifeExpectancyStartTime = performance.now();
      const savedLifeExpectancy = localStorage.getItem(
        "life-calendar-lifeExpectancy"
      );
      console.log(
        "localStorage lifeExpectancy fetch time:",
        (performance.now() - lifeExpectancyStartTime).toFixed(2),
        "ms",
        savedLifeExpectancy
          ? `(${savedLifeExpectancy.length} bytes)`
          : "(not found)"
      );

      const inspirationStartTime = performance.now();
      const savedInspiration = localStorage.getItem(
        "life-calendar-inspiration"
      );
      console.log(
        "localStorage inspiration fetch time:",
        (performance.now() - inspirationStartTime).toFixed(2),
        "ms",
        savedInspiration ? `(${savedInspiration.length} bytes)` : "(not found)"
      );

      // Process values
      const processStartTime = performance.now();
      if (savedName) setName(savedName);
      if (savedBirthdate) setBirthdate(savedBirthdate);
      if (savedLifeExpectancy) setLifeExpectancy(Number(savedLifeExpectancy));
      if (savedInspiration) setInspiration(savedInspiration);
      console.log(
        "localStorage process time:",
        (performance.now() - processStartTime).toFixed(2),
        "ms"
      );

      console.timeEnd("localStorage-total");

      setIsLoading(false);
      if (!savedBirthdate) setIsDialogOpen(true);
    }
  }, []);

  // Update useEffect to initialize form state when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setFormName(name);
      setFormBirthdate(birthdate);
      setFormLifeExpectancy(lifeExpectancy);
      setFormInspiration(inspiration);
    }
  }, [isDialogOpen, name, birthdate, lifeExpectancy, inspiration]);

  // Generate years array
  const getYears = () => {
    if (!birthdate && !isLoading) return [];
    const birthYear = birthdate
      ? new Date(birthdate).getFullYear()
      : new Date().getFullYear() - 40; // Default to 40 years ago if loading
    const endYear = birthYear + lifeExpectancy + 1;
    return Array.from({ length: endYear - birthYear }, (_, i) => birthYear + i);
  };

  // Modify handleSubmit to use form state
  const handleSubmit = (e) => {
    e.preventDefault();
    // Update main state with form values
    setName(formName);
    setBirthdate(formBirthdate);
    setLifeExpectancy(formLifeExpectancy);
    setInspiration(formInspiration);

    const data = { 
      name: formName, 
      birthdate: formBirthdate, 
      lifeExpectancy: formLifeExpectancy, 
      inspiration: formInspiration 
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set(data, () => {
        console.log("Settings saved");
        setIsDialogOpen(false);
      });
    } else {
      localStorage.setItem("life-calendar-name", formName);
      localStorage.setItem("life-calendar-birthdate", formBirthdate);
      localStorage.setItem(
        "life-calendar-lifeExpectancy",
        formLifeExpectancy.toString()
      );
      localStorage.setItem("life-calendar-inspiration", formInspiration);
      console.log("Settings saved to localStorage");
      setIsDialogOpen(false);
    }
  };

  console.log("birthWeek", birthWeek);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {name}, only {weeksRemaining.toLocaleString()} Sundays remain
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300">
          Each square represents one week of your life
        </p>
      </div>

      {/* Wrap entire grid in a single TooltipProvider */}
      <TooltipProvider>
        <div className="grid grid-cols-1 gap-4 mb-8 overflow-x-auto">
          <div className="flex flex-wrap justify-center gap-1">
            {getYears().map((year, yearIndex) => (
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
                                  ? "bg-gray-200" // Skeleton placeholder
                                  : isPast
                                  ? "bg-primary"
                                  : "bg-secondary"
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

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-8">{inspiration}</h2>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            [change name, date or inspiration]
          </Button>
        </div>
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
            <div className="grid gap-2">
              <Label htmlFor="inspiration">Inspiration Message</Label>
              <Input
                id="inspiration"
                value={formInspiration}
                onChange={(e) => setFormInspiration(e.target.value)}
                placeholder="Enter an inspirational message"
              />
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
