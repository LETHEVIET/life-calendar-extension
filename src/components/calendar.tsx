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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UseAnimations from "react-useanimations";
import infinity from "react-useanimations/lib/infinity";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { Switch } from "@/components/ui/switch.tsx";

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

  // Fetch random advice from API
  const fetchRandomAdvice = async () => {
    setAdviceLoading(true);
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      const data = await response.json();
      setRandomAdvice(data.slip.advice);
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

  // Load saved random advice during initial load
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["randomAdvice"], (result) => {
        if (result.randomAdvice) {
          setRandomAdvice(result.randomAdvice);
        }
      });
    } else {
      const savedRandomAdvice = localStorage.getItem("life-calendar-randomAdvice");
      if (savedRandomAdvice) {
        setRandomAdvice(savedRandomAdvice);
      }
    }
  }, []);

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
        [
          "name",
          "birthdate",
          "lifeExpectancy",
          "inspiration",
          "useRandomAdvice",
        ],
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
          console.log(
            "UseRandomAdvice:",
            result.useRandomAdvice,
            result.useRandomAdvice !== undefined
              ? `(${JSON.stringify(result.useRandomAdvice).length} bytes)`
              : "(not found)"
          );

          // Process the values
          const processStartTime = performance.now();
          if (result.name) setName(result.name);
          if (result.birthdate) setBirthdate(result.birthdate);
          if (result.lifeExpectancy) setLifeExpectancy(result.lifeExpectancy);
          if (result.inspiration) setInspiration(result.inspiration);
          if (result.useRandomAdvice !== undefined)
            setUseRandomAdvice(result.useRandomAdvice);
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

      const randomAdviceStartTime = performance.now();
      const savedUseRandomAdvice = localStorage.getItem(
        "life-calendar-useRandomAdvice"
      );
      console.log(
        "localStorage useRandomAdvice fetch time:",
        (performance.now() - randomAdviceStartTime).toFixed(2),
        "ms",
        savedUseRandomAdvice
          ? `(${savedUseRandomAdvice.length} bytes)`
          : "(not found)"
      );

      // Process values
      const processStartTime = performance.now();
      if (savedName) setName(savedName);
      if (savedBirthdate) setBirthdate(savedBirthdate);
      if (savedLifeExpectancy) setLifeExpectancy(Number(savedLifeExpectancy));
      if (savedInspiration) setInspiration(savedInspiration);
      if (savedUseRandomAdvice !== null)
        setUseRandomAdvice(savedUseRandomAdvice === "true");
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
      setFormUseRandomAdvice(useRandomAdvice);
    }
  }, [isDialogOpen, name, birthdate, lifeExpectancy, inspiration, useRandomAdvice]);

  // Modify handleSubmit to use form state
  const handleSubmit = (e) => {
    e.preventDefault();
    // Update main state with form values
    setName(formName);
    setBirthdate(formBirthdate);
    setLifeExpectancy(formLifeExpectancy);
    setInspiration(formInspiration);
    setUseRandomAdvice(formUseRandomAdvice);

    const data = {
      name: formName,
      birthdate: formBirthdate,
      lifeExpectancy: formLifeExpectancy,
      inspiration: formInspiration,
      useRandomAdvice: formUseRandomAdvice,
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set(data, () => {
        console.log("Settings saved");
        setIsDialogOpen(false);

        // Fetch new advice if switching to random mode
        if (formUseRandomAdvice && !useRandomAdvice) {
          fetchRandomAdvice();
        }
      });
    } else {
      localStorage.setItem("life-calendar-name", formName);
      localStorage.setItem("life-calendar-birthdate", formBirthdate);
      localStorage.setItem(
        "life-calendar-lifeExpectancy",
        formLifeExpectancy.toString()
      );
      localStorage.setItem("life-calendar-inspiration", formInspiration);
      localStorage.setItem(
        "life-calendar-useRandomAdvice",
        formUseRandomAdvice.toString()
      );
      console.log("Settings saved to localStorage");
      setIsDialogOpen(false);

      // Fetch new advice if switching to random mode
      if (formUseRandomAdvice && !useRandomAdvice) {
        fetchRandomAdvice();
      }
    }
  };

  // Get fresh advice
  const handleRefreshAdvice = () => {
    fetchRandomAdvice();
  };

  console.log("birthWeek", birthWeek);

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
    if (useRandomAdvice) {
      if (adviceLoading) {
        return "Loading advice...";
      }
      return randomAdvice || "Make today count";
    } else {
      return inspiration;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen absolute inset-0 m-auto">
          <UseAnimations animation={infinity} size={56} />
          <i>Loading...</i>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{getHeaderText()}</h1>

            <p className="text-lg text-gray-600 dark:text-gray-300">
              {getSubheaderText()}
            </p>
          </div>

          <Tabs
            defaultValue={activeTab}
            className=""
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-2 max-w-3xs mx-auto mb-4">
              <TabsTrigger value="life">Life</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
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
              <YearCalendarGrid birthdate={birthdate} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
          <div className="text-center mb-12">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-4"><i>{getInspirationMessage()}</i></h2>
              {useRandomAdvice && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshAdvice}
                  disabled={adviceLoading}
                  className="mb-4"
                >
                  {adviceLoading ? "Loading..." : "Get new advice"}
                </Button>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                [change name, date or inspiration]
              </Button>
            </div>
          </div>
        </>
      )}

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
