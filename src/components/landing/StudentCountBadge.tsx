"use client";

import { Users } from "lucide-react";

export function StudentCountBadge() {
  const studentCount = 181;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-brand-navy"
      style={{
        background:
          "linear-gradient(135deg, rgba(239,178,21,0.95) 0%, rgba(185,132,18,0.96) 100%)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow:
          "0 4px 16px rgba(239,178,21,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      <span>
        <Users className="h-3.5 w-3.5 text-brand-navy" />
      </span>
      <span className="text-xs font-semibold">Join {studentCount} students</span>
    </div>
  );
}
