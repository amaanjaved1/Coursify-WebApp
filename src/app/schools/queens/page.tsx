"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  MessageSquare,
  Search,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { fetchCoursesPage, fetchDepartments, fetchSubjects } from "@/lib/db";
import { getCourseDataAvailability } from "@/lib/course-availability";
import type { CourseWithStats } from "@/types";
import { useSearchParams, useRouter } from "next/navigation";

export default function QueensCourses() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    searchParams.get("departments")?.split(",").filter(Boolean) || [],
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    searchParams.get("levels")?.split(",").filter(Boolean) || [],
  );
  const [gpaRange, setGpaRange] = useState([
    parseFloat(searchParams.get("gpa_min") || "0"),
    parseFloat(searchParams.get("gpa_max") || "4.3"),
  ]);
  const [debouncedGpaRange, setDebouncedGpaRange] = useState([
    parseFloat(searchParams.get("gpa_min") || "0"),
    parseFloat(searchParams.get("gpa_max") || "4.3"),
  ]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>(() => {
    const sortBy = searchParams.get("sort_by");
    const sortDir = searchParams.get("sort_dir");
    if (sortBy) {
      return {
        key: sortBy,
        direction: sortDir === "desc" ? "descending" : "ascending",
      };
    }
    return { key: "availability", direction: "descending" };
  });
  const [enrollmentRange, setEnrollmentRange] = useState([
    parseFloat(searchParams.get("enroll_min") || "0"),
    parseFloat(searchParams.get("enroll_max") || "0"),
  ]);
  const [debouncedEnrollmentRange, setDebouncedEnrollmentRange] = useState([
    parseFloat(searchParams.get("enroll_min") || "0"),
    parseFloat(searchParams.get("enroll_max") || "0"),
  ]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    searchParams.get("subjects")?.split(",").filter(Boolean) || [],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<
    ("data" | "comments")[]
  >(() => {
    const raw =
      searchParams.get("availability")?.split(",").filter(Boolean) ?? [];
    const v = raw.filter(
      (x): x is "data" | "comments" => x === "data" || x === "comments",
    );
    if (v.length === 0) return ["data", "comments"];
    return v;
  });
  const hasData = true;
  const [departments, setDepartments] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1"),
  );
  const coursesPerPage = 25;

  const filterDebounceMs = 1200;
  const courseLevels = ["100", "200", "300", "400", "500"];

  // Fetch filter options on mount
  useEffect(() => {
    fetchDepartments().then(setDepartments);
    fetchSubjects().then(setSubjects);
  }, []);

  // Debounce search input (only when live term differs from applied debounced value)
  useEffect(() => {
    if (searchTerm === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Debounce GPA and enrollment sliders to avoid overloading requests
  useEffect(() => {
    const gpaMatches =
      debouncedGpaRange[0] === gpaRange[0] &&
      debouncedGpaRange[1] === gpaRange[1];
    const enrollmentMatches =
      debouncedEnrollmentRange[0] === enrollmentRange[0] &&
      debouncedEnrollmentRange[1] === enrollmentRange[1];
    if (gpaMatches && enrollmentMatches) return;

    setLoading(true);

    const timer = setTimeout(() => {
      setDebouncedGpaRange(gpaRange);
      setDebouncedEnrollmentRange(enrollmentRange);
      setCurrentPage(1);
    }, filterDebounceMs);

    return () => clearTimeout(timer);
  }, [gpaRange, enrollmentRange, debouncedGpaRange, debouncedEnrollmentRange]);

  // Sync URL params
  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (
          value &&
          value !== "" &&
          value !== "0" &&
          value !== "4.3" &&
          value !== "1" &&
          value !== "true"
        ) {
          newParams.set(key, value);
        } else if (key === "has_data" && value === "false") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      const paramString = newParams.toString();
      router.replace(paramString ? `?${paramString}` : "", { scroll: false });
    },
    [searchParams, router],
  );

  // Fetch courses when filters change
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoading(true);
      try {
        const result = await fetchCoursesPage({
          page: currentPage,
          limit: coursesPerPage,
          search: debouncedSearch || undefined,
          departments:
            selectedDepartments.length > 0 ? selectedDepartments : undefined,
          levels: selectedLevels.length > 0 ? selectedLevels : undefined,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          gpaMin: debouncedGpaRange[0],
          gpaMax: debouncedGpaRange[1],
          enrollmentMin: debouncedEnrollmentRange[0],
          enrollmentMax: debouncedEnrollmentRange[1],
          sortBy: sortConfig.key as
            | "code"
            | "name"
            | "gpa"
            | "enrollment"
            | "availability",
          sortDir: sortConfig.direction === "ascending" ? "asc" : "desc",
          hasData,
          availability:
            selectedAvailability.includes("data") &&
            selectedAvailability.includes("comments")
              ? undefined
              : selectedAvailability,
        });
        if (!cancelled) {
          setCourses(result.courses);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCourses();

    // Update URL
    updateUrl({
      page: currentPage > 1 ? String(currentPage) : undefined,
      search: debouncedSearch || undefined,
      departments:
        selectedDepartments.length > 0
          ? selectedDepartments.join(",")
          : undefined,
      levels: selectedLevels.length > 0 ? selectedLevels.join(",") : undefined,
      subjects:
        selectedSubjects.length > 0 ? selectedSubjects.join(",") : undefined,
      gpa_min: gpaRange[0] > 0 ? String(gpaRange[0]) : undefined,
      gpa_max:
        debouncedGpaRange[1] < 4.3 ? String(debouncedGpaRange[1]) : undefined,
      enroll_min:
        debouncedEnrollmentRange[0] > 0
          ? String(debouncedEnrollmentRange[0])
          : undefined,
      enroll_max:
        debouncedEnrollmentRange[1] > 0
          ? String(debouncedEnrollmentRange[1])
          : undefined,
      sort_by: sortConfig.key || undefined,
      sort_dir: sortConfig.direction === "ascending" ? "asc" : "desc",
      availability:
        selectedAvailability.includes("data") &&
        selectedAvailability.includes("comments")
          ? undefined
          : selectedAvailability.join(","),
    });

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    debouncedSearch,
    selectedDepartments,
    selectedLevels,
    selectedSubjects,
    selectedAvailability,
    debouncedGpaRange,
    debouncedEnrollmentRange,
    sortConfig,
  ]);

  const requestSort = (key: string) => {
    // GPA, enrollment, availability: first click = descending (highest / data-first)
    const defaultDesc =
      key === "gpa" || key === "enrollment" || key === "availability";
    let direction: "ascending" | "descending" = defaultDesc
      ? "descending"
      : "ascending";

    if (sortConfig && sortConfig.key === key) {
      direction =
        sortConfig.direction === "ascending" ? "descending" : "ascending";
    }

    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.7) return "text-green-600";
    if (gpa >= 3.0) return "text-blue-600";
    if (gpa >= 2.3) return "text-yellow-600";
    return "text-red-600";
  };

  function AvailabilityBadge({ course }: { course: CourseWithStats }) {
    const tier = getCourseDataAvailability(course);
    if (tier === "data") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">
          <BarChart3 className="h-3 w-3 shrink-0" />
          Data available
        </span>
      );
    }
    if (tier === "comments") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full whitespace-nowrap">
          <MessageSquare className="h-3 w-3 shrink-0" />
          Comments only
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">
        No data
      </span>
    );
  }

  const resetFilters = () => {
    const sortIsAtDefault =
      sortConfig.key === "availability" &&
      sortConfig.direction === "descending";
    if (
      !hasActiveFilters &&
      sortIsAtDefault &&
      searchTerm === "" &&
      currentPage === 1
    )
      return;

    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedDepartments([]);
    setSelectedLevels([]);
    setSelectedSubjects([]);
    setGpaRange([0, 4.3]);
    setDebouncedGpaRange([0, 4.3]);
    setEnrollmentRange([0, 0]);
    setDebouncedEnrollmentRange([0, 0]);
    setSelectedAvailability(["data", "comments"]);
    setSortConfig({ key: "availability", direction: "descending" });
    setCurrentPage(1);
  };

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((d) => d !== department)
        : [...prev, department],
    );
    setCurrentPage(1);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
    setCurrentPage(1);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
    setCurrentPage(1);
  };

  const toggleAvailabilityTier = (tier: "data" | "comments") => {
    setSelectedAvailability((prev) => {
      const next = prev.includes(tier)
        ? prev.filter((t) => t !== tier)
        : [...prev, tier];
      if (next.length === 0) return ["data", "comments"];
      return next;
    });
    setCurrentPage(1);
  };

  const handleCatalogSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (catalogSearch.trim()) {
      router.push(
        `/schools/queens/search?q=${encodeURIComponent(catalogSearch.trim())}`,
      );
    }
  };

  const availabilityFilterActive =
    !selectedAvailability.includes("data") ||
    !selectedAvailability.includes("comments");

  const hasActiveFilters =
    debouncedSearch !== "" ||
    selectedDepartments.length > 0 ||
    selectedLevels.length > 0 ||
    selectedSubjects.length > 0 ||
    availabilityFilterActive ||
    gpaRange[0] > 0 ||
    gpaRange[1] < 4.3 ||
    enrollmentRange[0] > 0 ||
    enrollmentRange[1] > 0;

  return (
    <div className="relative min-h-screen overflow-hidden mesh-gradient pt-20">
      <style jsx global>{`
        .mesh-gradient {
          background: transparent;
        }

        .glass-card-deep {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.82);
          box-shadow:
            0 8px 32px rgba(0, 48, 95, 0.13),
            0 2px 8px rgba(0, 48, 95, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1px 0 rgba(255, 255, 255, 0.3);
        }

        /* Override shadcn ghost variant accent hover on all glass buttons */
        .glass-btn:hover,
        .glass-btn:focus {
          background: rgba(255, 255, 255, 0.55) !important;
          box-shadow:
            0 4px 20px rgba(0, 48, 95, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
          color: inherit !important;
        }

        /* Override CommandItem yellow highlight */
        [cmdk-item][data-selected="true"],
        [cmdk-item][aria-selected="true"],
        [role="option"][data-selected="true"],
        [role="option"][aria-selected="true"] {
          background-color: rgba(0, 48, 95, 0.08) !important;
          color: #00305f !important;
        }

        .search-glass {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.82);
          box-shadow:
            0 4px 20px rgba(0, 48, 95, 0.09),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-radius: 0.75rem;
          padding: 0.5rem;
        }

        /* ── Dark-mode overrides ── */
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        :is(.dark) .gradient-text {
          background: linear-gradient(
            -45deg,
            #4a9eff,
            #ff4d5e,
            #ffc940,
            #4a9eff
          );
          background-size: 300% 300%;
          animation: gradient-shift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }

        :is(.dark) .glass-card-deep {
          background: rgba(38, 38, 38, 0.82);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02);
        }

        :is(.dark) .glass-btn:hover,
        :is(.dark) .glass-btn:focus {
          background: rgba(48, 48, 48, 0.65) !important;
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }

        :is(.dark) [cmdk-item][data-selected="true"],
        :is(.dark) [cmdk-item][aria-selected="true"],
        :is(.dark) [role="option"][data-selected="true"],
        :is(.dark) [role="option"][aria-selected="true"] {
          background-color: rgba(74, 158, 255, 0.15) !important;
          color: #4a9eff !important;
        }

        :is(.dark) .search-glass {
          background: rgba(38, 38, 38, 0.82);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="container py-12 px-4 lg-filters:px-6 relative z-10">
        <div className="mb-12 text-center lg-filters:text-left">
          <h1 className="text-3xl lg-filters:text-4xl font-bold mb-4">
            <span className="text-brand-navy dark:text-white">
              Queen's University
            </span>{" "}
            <span className="gradient-text">Courses</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto lg-filters:mx-0">
            Browse and filter through all courses offered at Queen's University.
            View grade distributions, enrollment data, and more to help you make
            informed course decisions.
          </p>
        </div>

        <div className="flex flex-col lg-filters:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="search-glass">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-brand-navy/10 dark:bg-blue-400/10">
                  <Search className="h-3.5 w-3.5 text-brand-navy dark:text-white" />
                </div>
                <Input
                  placeholder="Search by course code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-brand-navy dark:text-white placeholder:text-brand-navy/40 dark:placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-stretch">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="lg-filters:hidden glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30 h-14 min-h-14 rounded-xl px-5"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className={`whitespace-nowrap h-14 min-h-14 rounded-xl px-5 ${
                hasActiveFilters
                  ? "liquid-btn-red border-0 text-white hover:bg-transparent"
                  : "glass-btn border-0 text-brand-red hover:bg-white/30"
              }`}
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg-filters:grid-cols-4 gap-6 mb-8">
          <div
            className={`lg-filters:col-span-1 ${showFilters ? "block" : "hidden lg-filters:block"}`}
          >
            <div className="glass-card-deep rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium flex items-center text-brand-navy dark:text-white">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="lg-filters:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Subject Prefix Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    Subject
                  </label>
                  <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={subjectOpen}
                        className="w-full justify-between glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        {selectedSubjects.length > 0
                          ? `${selectedSubjects.length} selected`
                          : "Select subjects (e.g. CISC)"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search subjects..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {subjects.map((subj) => (
                              <CommandItem
                                key={subj}
                                value={subj}
                                onSelect={() => toggleSubject(subj)}
                                className="flex items-center"
                              >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                  {selectedSubjects.includes(subj) && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                                <span>{subj}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Data availability */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    Data availability
                  </label>
                  <Popover
                    open={availabilityOpen}
                    onOpenChange={setAvailabilityOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={availabilityOpen}
                        className="w-full justify-between glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        {selectedAvailability.includes("data") &&
                        selectedAvailability.includes("comments")
                          ? "All types"
                          : selectedAvailability.includes("data")
                            ? "Data available only"
                            : "Comments only"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup heading="Show courses with">
                            <CommandItem
                              value="data-available"
                              onSelect={() => toggleAvailabilityTier("data")}
                              className="flex items-center"
                            >
                              <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                {selectedAvailability.includes("data") && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <span>Data available (grade stats)</span>
                            </CommandItem>
                            <CommandItem
                              value="comments-only"
                              onSelect={() =>
                                toggleAvailabilityTier("comments")
                              }
                              className="flex items-center"
                            >
                              <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                {selectedAvailability.includes("comments") && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <span>Comments only</span>
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Department Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    Department
                  </label>
                  <Popover
                    open={departmentOpen}
                    onOpenChange={setDepartmentOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={departmentOpen}
                        className="w-full justify-between glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        {selectedDepartments.length > 0
                          ? `${selectedDepartments.length} selected`
                          : "Select departments"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search departments..." />
                        <CommandList>
                          <CommandEmpty>No department found.</CommandEmpty>
                          <CommandGroup>
                            {departments.map((dept) => (
                              <CommandItem
                                key={dept}
                                value={dept}
                                onSelect={() => toggleDepartment(dept)}
                                className="flex items-center"
                              >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                  {selectedDepartments.includes(dept) && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                                <span>{dept}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Course Level Dropdown */}
                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    Course Level
                  </label>
                  <Popover open={levelOpen} onOpenChange={setLevelOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={levelOpen}
                        className="w-full justify-between glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        {selectedLevels.length > 0
                          ? `${selectedLevels.length} selected`
                          : "Select levels"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {courseLevels.map((level) => (
                              <CommandItem
                                key={level}
                                value={level}
                                onSelect={() => toggleLevel(level)}
                                className="flex items-center"
                              >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                  {selectedLevels.includes(level) && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                                <span>{level}-Level</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* GPA Range with Circle Handles */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    GPA Range
                  </label>
                  <div className="pt-4 px-2">
                    <Slider
                      defaultValue={[0, 4.3]}
                      value={gpaRange}
                      onValueChange={setGpaRange}
                      onValueCommit={(value) => {
                        setGpaRange(value);
                        setCurrentPage(1);
                      }}
                      max={4.3}
                      step={0.1}
                      className="mb-6"
                    />
                    <div className="flex justify-between text-sm text-brand-navy dark:text-white">
                      <span className="font-medium">
                        {gpaRange[0].toFixed(1)}
                      </span>
                      <span className="font-medium">
                        {gpaRange[1].toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                  </div>
                </div>

                {/* Enrollment Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-brand-navy dark:text-white">
                    Avg. Enrollment
                  </label>
                  <div className="pt-4 px-2">
                    <Slider
                      defaultValue={[0, 600]}
                      value={[enrollmentRange[0], enrollmentRange[1] || 600]}
                      onValueChange={(v) => setEnrollmentRange(v)}
                      onValueCommit={(value) => {
                        setEnrollmentRange(
                          value[1] >= 600 ? [value[0], 0] : value,
                        );
                        setCurrentPage(1);
                      }}
                      max={600}
                      step={10}
                      className="mb-6"
                    />
                    <div className="flex justify-between text-sm text-brand-navy dark:text-white">
                      <span className="font-medium">{enrollmentRange[0]}</span>
                      <span className="font-medium">
                        {enrollmentRange[1] > 0 ? enrollmentRange[1] : "600+"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/60">
                  <div className="text-xs text-muted-foreground mb-2">
                    Active Filters:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availabilityFilterActive && (
                      <Badge className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center">
                        {selectedAvailability.includes("data")
                          ? "Data available only"
                          : "Comments only"}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAvailability(["data", "comments"])
                          }
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedDepartments.map((dept) => (
                      <Badge
                        key={dept}
                        className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center"
                      >
                        {dept}
                        <button
                          onClick={() =>
                            setSelectedDepartments(
                              selectedDepartments.filter((d) => d !== dept),
                            )
                          }
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedSubjects.map((subj) => (
                      <Badge
                        key={subj}
                        className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center"
                      >
                        {subj}
                        <button
                          onClick={() =>
                            setSelectedSubjects(
                              selectedSubjects.filter((s) => s !== subj),
                            )
                          }
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedLevels.map((level) => (
                      <Badge
                        key={level}
                        className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center"
                      >
                        {level}-Level
                        <button
                          onClick={() =>
                            setSelectedLevels(
                              selectedLevels.filter((l) => l !== level),
                            )
                          }
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(enrollmentRange[0] > 0 || enrollmentRange[1] > 0) && (
                      <Badge className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center">
                        Enrollment: {enrollmentRange[0]}–
                        {enrollmentRange[1] > 0 ? enrollmentRange[1] : "600+"}
                        <button
                          onClick={() => setEnrollmentRange([0, 0])}
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {(gpaRange[0] > 0 || gpaRange[1] < 4.3) && (
                      <Badge className="bg-brand-navy/10 dark:bg-blue-400/10 text-brand-navy dark:text-white hover:bg-brand-navy/20 dark:hover:bg-blue-400/20 flex items-center">
                        GPA: {gpaRange[0].toFixed(1)} - {gpaRange[1].toFixed(1)}
                        <button
                          onClick={() => setGpaRange([0, 4.3])}
                          className="ml-1 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg-filters:col-span-3">
            {loading ? (
              <div className="glass-card-deep rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-brand-navy/5 dark:bg-blue-400/5">
                        {["Course Code", "Course Name", "Data Availability", "Avg. GPA", "Enrollment"].map((col) => (
                          <th key={col} className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 15 }).map((_, i) => (
                        <tr key={i} className="border-t border-black/5 dark:border-white/5">
                          <td className="px-4 py-3">
                            <div className="h-4 w-20 rounded bg-black/[0.07] dark:bg-white/[0.08] animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 rounded bg-black/[0.07] dark:bg-white/[0.08] animate-pulse" style={{ width: `${55 + (i * 17) % 35}%` }} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-24 rounded bg-black/[0.07] dark:bg-white/[0.08] animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-12 rounded bg-black/[0.07] dark:bg-white/[0.08] animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-16 rounded bg-black/[0.07] dark:bg-white/[0.08] animate-pulse" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-card-deep rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-brand-navy/5 dark:bg-blue-400/5">
                        <th className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                          <button
                            className="flex items-center"
                            onClick={() => requestSort("code")}
                          >
                            Course Code {getSortIcon("code")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                          <button
                            className="flex items-center"
                            onClick={() => requestSort("name")}
                          >
                            Course Name {getSortIcon("name")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                          <button
                            type="button"
                            className="flex items-center"
                            onClick={() => requestSort("availability")}
                          >
                            Data Availability {getSortIcon("availability")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                          <button
                            className="flex items-center"
                            onClick={() => requestSort("gpa")}
                          >
                            Avg. GPA {getSortIcon("gpa")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-brand-navy dark:text-white">
                          <button
                            className="flex items-center"
                            onClick={() => requestSort("enrollment")}
                          >
                            Enrollment {getSortIcon("enrollment")}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <tr
                            key={course.id}
                            className="border-t hover:bg-brand-navy/5 dark:hover:bg-blue-400/5 transition-colors duration-200 cursor-pointer"
                            onClick={() => router.push(`/schools/queens/${course.course_code.replace(/\s+/g, "-").toLowerCase()}`)}
                          >
                            <td className="px-4 py-3 text-sm font-medium">
                              <span className="text-brand-red dark:text-brand-navy-light">
                                {course.course_code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {course.course_name}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <AvailabilityBadge course={course} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {course.averageGPA > 0 ? (
                                <span
                                  className={`font-medium ${getGpaColor(course.averageGPA)}`}
                                >
                                  {course.averageGPA.toFixed(1)}
                                </span>
                              ) : (
                                <span className="font-medium text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                {course.totalEnrollment > 0 ? (
                                  <>
                                    <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                      <div
                                        className="bg-brand-navy dark:bg-blue-400 rounded-full h-2"
                                        style={{
                                          width: `${Math.min((course.totalEnrollment / 600) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    {Math.round(course.totalEnrollment)}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-muted-foreground"
                          >
                            No courses found matching your filters. Try
                            adjusting your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm px-6 py-4 text-sm text-muted-foreground border-t border-white/60 dark:border-white/5 flex flex-col lg-filters:flex-row justify-between items-center gap-4">
                  <div>
                    Showing{" "}
                    {courses.length > 0
                      ? (currentPage - 1) * coursesPerPage + 1
                      : 0}
                    –{Math.min(currentPage * coursesPerPage, total)} of {total}{" "}
                    courses
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage >= totalPages}
                        className="glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  <div className="text-xs bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full">
                    <strong>Note:</strong> GPA is calculated on a 4.3 scale
                  </div>
                </div>
              </div>
            )}

            {/* Course not showing up? */}
            <div className="mt-6 p-6 glass-card-deep rounded-xl relative overflow-hidden">
              <h3 className="text-lg font-bold text-brand-navy dark:text-white mb-2">
                Course not showing up?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Search our full catalog — we may not have grade data for it yet.
                Help us out by{" "}
                <a
                  href="/add-courses"
                  className="text-brand-red font-medium hover:underline"
                >
                  uploading grade distributions
                </a>
                !
              </p>
              <form
                onSubmit={handleCatalogSearch}
                className="flex gap-2 items-stretch"
              >
                <div className="flex-1 search-glass">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-brand-navy/10 dark:bg-blue-400/10">
                      <Search className="h-3 w-3 text-brand-navy dark:text-white" />
                    </div>
                    <Input
                      placeholder="Search all courses..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="pl-12 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-brand-navy dark:text-white placeholder:text-brand-navy/40 dark:placeholder:text-white/40 text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="liquid-btn-red border-0 text-white shrink-0 h-14 min-h-14 rounded-xl px-6"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* AI helper */}
            <div className="mt-4 p-6 glass-card-deep rounded-xl relative overflow-hidden">
              <h3 className="text-lg font-bold text-brand-navy dark:text-white mb-3">
                Need Help Choosing?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Our AI assistant can provide personalized course recommendations
                based on your interests, learning style, and academic goals.
              </p>
              <Button asChild className="liquid-btn-red border-0 text-white">
                <a href="/queens-answers">Ask AI Assistant</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
