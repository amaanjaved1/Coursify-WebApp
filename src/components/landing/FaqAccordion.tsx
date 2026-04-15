"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMotionTier } from "@/lib/motion-prefs";

const faqs = [
  {
    question: "Is Coursify connected to SOLUS?",
    answer:
      "Coursify is not officially connected to SOLUS, but we've collected grade distribution data from multiple reliable sources. You'll need to register for courses through SOLUS after researching them on our platform.",
  },
  {
    question: "Where does the chatbot get its information?",
    answer:
      "Our AI advisor is trained on thousands of student reviews from Queen's course catalogs, Reddit discussions, and RateMyProfessors reviews to provide you with comprehensive insights about courses and professors.",
  },
  {
    question: "How up-to-date is the grade data?",
    answer:
      "We update our database each semester with the latest grade distributions and course information to ensure you have access to the most current data for decision making.",
  },
  {
    question: "Is this tool free?",
    answer:
      "Yes, Coursify is completely free for all Queen's University students. We believe in making data-driven course selection accessible to everyone.",
  },
  {
    question: "What courses are supported?",
    answer:
      "Currently, Coursify only supports on-campus courses at Queen's University. We're working on adding support for online courses in the future, but for now, our data and AI assistant focus exclusively on in-person course offerings.",
  },
];

const colorClasses = [
  {
    iconBg: "bg-brand-red/10",
    iconText: "text-brand-red",
    iconHoverBg: "group-hover:bg-brand-red",
  },
  {
    iconBg: "bg-brand-navy/10 dark:bg-brand-navy-light/20",
    iconText: "text-brand-navy dark:text-white",
    iconHoverBg: "group-hover:bg-brand-navy dark:group-hover:bg-brand-navy-light",
  },
  {
    iconBg: "bg-brand-gold/10",
    iconText: "text-brand-gold",
    iconHoverBg: "group-hover:bg-brand-gold",
  },
];

export function FaqAccordion() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const motionTier = useMotionTier();
  const lite = motionTier === "lite";

  return (
    <div className="space-y-3 [overflow-anchor:none]">
      {faqs.map((faq, index) => {
        const colors = colorClasses[index % 3];
        return (
          <div
            key={index}
            className="group glass-accordion rounded-2xl p-6 cursor-pointer"
            onClick={() =>
              setActiveAccordion(activeAccordion === index ? null : index)
            }
          >
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${colors.iconBg} ${colors.iconText} ${colors.iconHoverBg} group-hover:text-white`}
                >
                  {activeAccordion === index ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-brand-navy dark:text-white mb-2">
                  {faq.question}
                </h3>
                <motion.div
                  initial={false}
                  animate={{
                    height: activeAccordion === index ? "auto" : 0,
                    opacity: activeAccordion === index ? 1 : 0,
                  }}
                  transition={{
                    duration: lite ? 0.15 : 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden [overflow-anchor:none]"
                >
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
