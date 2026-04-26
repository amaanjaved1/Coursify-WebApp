"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { getSafeRedirectPath, buildAuthHref } from "@/lib/auth/safe-redirect";
import { useMotionTier } from "@/lib/motion-prefs";

export default function ResendVerificationEmailPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const lite = useMotionTier() === "lite";
  const searchParams = useSearchParams();

  const nextPath = useMemo(
    () => getSafeRedirectPath(searchParams.get("redirect"), "/"),
    [searchParams],
  );

  const signInHref = useMemo(
    () => buildAuthHref("/sign-in", nextPath),
    [nextPath],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to resend verification email");
      }
      setSent(true);
      toast({
        title: "Request received",
        description:
          "If an unverified account exists, you'll receive a new verification link shortly.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Couldn't resend email",
        description: err?.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-12">
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={false}
        animate={lite ? undefined : { opacity: 1, y: 0 }}
        transition={
          lite ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="flex flex-col gap-7">
          <motion.div
            initial={false}
            animate={lite ? undefined : { opacity: 1, y: 0 }}
            transition={lite ? { duration: 0 } : { duration: 0.6, delay: 0.15 }}
          >
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-brand-navy dark:text-white">
              Resend Verification
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your Queen&apos;s email to receive a new verification link.
            </p>
          </motion.div>

          {sent ? (
            <div className="space-y-5">
              <div className="glass-card rounded-2xl p-6 border-l-4 border-brand-navy dark:border-blue-400">
                <h3 className="font-semibold text-lg mb-2 text-brand-navy dark:text-white">
                  Check your email
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  If an unverified account exists for{" "}
                  <strong className="text-brand-navy dark:text-white">
                    {email}
                  </strong>
                  , we&apos;ve sent a new verification link.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-3 leading-relaxed">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    (!)
                  </span>{" "}
                  Queen&apos;s Outlook can sometimes delay external emails while
                  they&apos;re being scanned, especially during busy periods. If
                  you don&apos;t see it right away, wait a few minutes and check
                  your spam/junk folder too.
                </p>
              </div>
              <Link
                href={signInHref}
                className="block text-center text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium text-sm transition-colors duration-300"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <motion.div
                initial={false}
                animate={lite ? undefined : { opacity: 1, y: 0 }}
                transition={
                  lite ? { duration: 0 } : { duration: 0.5, delay: 0.25 }
                }
              >
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Email Address
                </label>
                <div className="glass-card rounded-2xl transition-all duration-300 focus-within:border-brand-navy/30 dark:focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_3px_rgba(0,48,95,0.08)]">
                  <input
                    type="email"
                    placeholder="your.name@queensu.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-4 rounded-2xl focus:outline-none"
                  />
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                initial={false}
                animate={lite ? undefined : { opacity: 1, y: 0 }}
                transition={
                  lite ? { duration: 0 } : { duration: 0.5, delay: 0.45 }
                }
                className="liquid-btn-red w-full rounded-2xl py-4 font-medium text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Verification Email"}
              </motion.button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Remembered your password?{" "}
                <Link
                  href={signInHref}
                  className="text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium transition-colors duration-300"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
