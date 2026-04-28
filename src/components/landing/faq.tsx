"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is Coursify connected to SOLUS?",
    answer: "Coursify is not officially connected to SOLUS, but we've collected grade distribution data from multiple reliable sources. You'll need to register for courses through SOLUS after researching them on our platform.",
  },
  {
    question: "Where does the chatbot get its information?",
    answer: "Our AI advisor is trained on thousands of student reviews from Queen's course catalogs, Reddit discussions, and RateMyProfessors reviews to provide you with comprehensive insights about courses and professors.",
  },
  {
    question: "How up-to-date is the grade data?",
    answer: "We update our database each semester with the latest grade distributions and course information to ensure you have access to the most current data for decision making.",
  },
  {
    question: "Is this tool free?",
    answer: "Yes, Coursify is completely free for all Queen's University students. We believe in making data-driven course selection accessible to everyone.",
  },
  {
    question: "What courses are supported?",
    answer: "Currently, Coursify only supports on-campus courses at Queen's University. We're working on adding support for online courses in the future, but for now, our data and AI assistant focus exclusively on in-person course offerings.",
  },
];

const colorClasses = [
  { iconBg: "bg-brand-red/10 dark:bg-brand-red/20", iconText: "text-brand-red" },
  { iconBg: "bg-brand-navy/10 dark:bg-blue-400/10", iconText: "text-brand-navy dark:text-blue-400" },
  { iconBg: "bg-brand-gold/10 dark:bg-brand-gold/20", iconText: "text-brand-gold" },
];

export function PageFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const colors = colorClasses[index % 3];
        const isOpen = open === index;
        return (
          <div
            key={index}
            className="glass-accordion rounded-2xl p-6 cursor-pointer select-none"
            onClick={() => setOpen(isOpen ? null : index)}
          >
            <div className="flex items-start">
              <div className={`mr-4 mt-0.5 flex shrink-0 items-center justify-center w-6 h-6 rounded-full ${colors.iconBg} ${colors.iconText}`}>
                <ChevronDown className={`h-3.5 w-3.5 ${isOpen ? "rotate-180" : ""}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-brand-navy dark:text-white">{faq.question}</h3>
                {isOpen && (
                  <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
