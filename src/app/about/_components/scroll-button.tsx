"use client"

import { ChevronDown } from "lucide-react"

export function ScrollButton() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <button
      type="button"
      onClick={scrollToFeatures}
      className="liquid-btn-red group text-white px-7 py-3 rounded-xl font-medium w-full sm:w-auto inline-block text-center"
    >
      <span className="relative z-10 flex items-center justify-center">
        See Features
        <ChevronDown className="ml-2 h-5 w-5 transform group-hover:translate-y-0.5 transition-transform duration-300" />
      </span>
    </button>
  )
}
