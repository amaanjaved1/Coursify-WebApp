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
    answer: "Currently, Coursify supports all Queen's University courses. We continuously expand our database to include new courses and updated information each semester.",
  },
  {
    question: "Can I upload grade distributions?",
    answer: "Yes! If you have access to grade distribution data that isn't currently in our system, you can upload it through your settings page. This helps keep our database comprehensive and up-to-date for all students.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200 flex justify-between items-center"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  openIndex === index ? "transform rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}