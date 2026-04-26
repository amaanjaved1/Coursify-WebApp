"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

function normalizeCourseCode(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const match = /^([A-Za-z]{3,5})\s*(\d{3}[A-Za-z]?)$/.exec(trimmed);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

export function HeroCourseSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const placeholder = useMemo(() => "Find a course (e.g. CISC 151)", []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeCourseCode(value);
    if (!normalized) {
      setError(
        'Please enter a course code in the format "CISC 151". ',
      );
      return;
    }

    // If the user typed e.g. "cisc121", normalize the input display to "CISC 121".
    if (value.trim() !== normalized) {
      setValue(normalized);
    }

    // Reuse the existing View Courses page logic and its "no results" state.
    router.push(`/schools/queens?search=${encodeURIComponent(normalized)}`);
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
            className="liquid-btn-blue px-5 rounded-xl text-white text-sm font-medium"
          >
            Find
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

