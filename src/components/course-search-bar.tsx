"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseSearchBarProps {
  className?: string;
  placeholder?: string;
}

export function CourseSearchBar({
  className,
  placeholder = "Search all courses...",
}: CourseSearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/schools/queens/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2 items-stretch", className)}>
      <div className="flex-1 glass-card rounded-xl p-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-brand-navy/10 dark:bg-blue-400/10">
            <Search className="h-3 w-3 text-brand-navy dark:text-white" />
          </div>
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
  );
}
