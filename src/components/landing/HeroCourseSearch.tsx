"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { fetchCoursesPage } from "@/lib/db";

function normalizeCourseCode(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const match = /^([A-Za-z]{3,5})\s*(\d{3}[A-Za-z]?)$/.exec(trimmed);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

function toCourseSlug(courseCode: string) {
  return courseCode.replace(/\s+/g, "-").toLowerCase();
}

export function HeroCourseSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const placeholder = useMemo(() => "Find a course (e.g. CISC 151)", []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeCourseCode(value);
    if (!normalized) {
      setError("Please use the format like CISC 151.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchCoursesPage({
        search: normalized,
        limit: 5,
        page: 1,
        sortBy: "code",
        sortDir: "asc",
        hasData: false,
      });

      const exact = result.courses.find(
        (c) => c.course_code.trim().toUpperCase() === normalized,
      );

      if (exact) {
        router.push(`/schools/queens/${toCourseSlug(exact.course_code)}`);
        return;
      }

      router.push(`/schools/queens?search=${encodeURIComponent(normalized)}`);
    } catch {
      router.push(`/schools/queens?search=${encodeURIComponent(normalized)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full max-w-lg">
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex items-stretch gap-2">
          <div className="glass-card flex-1 rounded-xl px-4 py-3 flex items-center gap-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
              aria-label="Find a course by code"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="liquid-btn-blue px-5 rounded-xl text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Searching..." : "Find"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-brand-red dark:text-brand-red">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

