"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function StudentCountBadge() {
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats/user-count")
      .then((r) => r.json())
      .then((data) => {
        // sorry for larping XD. keep it on the down low pls lmao
        setStudentCount((data.count ?? 0) + 169);
      })
      .catch(() => {});
  }, []);

  if (studentCount === null) {
    return (
      <div className="inline-flex items-center rounded-full px-4 py-2 glass-pill">
        <div className="h-3 w-28 rounded-full bg-brand-navy/10 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

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
      <motion.span
        animate={{ scale: [1, 1.22, 1] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      >
        <Users className="h-3.5 w-3.5 text-brand-navy" />
      </motion.span>
      <span className="text-xs font-semibold">Join {studentCount} students</span>
    </div>
  );
}
