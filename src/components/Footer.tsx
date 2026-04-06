"use client"

import Link from "next/link"

const Footer = () => {
  return (
    <footer className="relative border-t border-black/[0.06] dark:border-white/10 py-4 bg-[var(--page-bg)]">
      <style jsx global>{`
        .moving-gradient {
          background: linear-gradient(
            90deg,
            #00305f 0%,
            #d62839 30%,
            #efb215 60%,
            #00305f 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          animation: shine 8s linear infinite;
          display: inline-block;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
      `}</style>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="mb-1 md:mb-0">
            <Link href="/" className="inline-flex items-center mb-1 shrink-0">
              <span className="text-sm font-bold tracking-tight text-brand-navy dark:text-white">Cours</span>
              <span className="text-sm font-bold tracking-tight text-brand-red">ify</span>
            </Link>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Platform for{" "}
              <span className="moving-gradient font-medium">
                Queen&apos;s Students
              </span>{" "}
              by{" "}
              <span className="moving-gradient font-medium">
                Queen&apos;s Students
              </span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
              Not affiliated with or endorsed by Queen&apos;s University
            </p>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center flex-wrap gap-2">
            <span className="moving-gradient font-medium">
              © {new Date().getFullYear()} Coursify
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/about"
              className="text-brand-navy dark:text-white hover:text-brand-red transition-colors duration-200 font-medium"
            >
              About Us
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/privacy"
              className="text-brand-navy dark:text-white hover:text-brand-red transition-colors duration-200 font-medium"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/terms"
              className="text-brand-navy dark:text-white hover:text-brand-red transition-colors duration-200 font-medium"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
