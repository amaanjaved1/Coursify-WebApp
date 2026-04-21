"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import { useMotionTier } from "@/lib/motion-prefs";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = getSupabaseClient();
  const lite = useMotionTier() === "lite";

  const isQueensEmail = (email: string) => {
    return email.endsWith("@queensu.ca");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isQueensEmail(email)) {
      toast({
        title: "Invalid email domain",
        description: "Please use your Queen's University email address (@queensu.ca)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({ title: "Password reset email sent", description: "Check your email for a link to reset your password", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-12">
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={false}
        animate={lite ? undefined : { opacity: 1, y: 0 }}
        transition={lite ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-7">
          {/* Back link */}
          <motion.div
            initial={false}
            animate={lite ? undefined : { opacity: 1, x: 0 }}
            transition={lite ? { duration: 0 } : { duration: 0.4, delay: 0.1 }}
          >
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-blue-400 transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={false}
            animate={lite ? undefined : { opacity: 1, y: 0 }}
            transition={lite ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-brand-navy dark:text-white">
              Reset Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your Queen&apos;s email and we&apos;ll send you a reset link
            </p>
          </motion.div>

          {isSuccess ? (
            <motion.div
              initial={false}
              animate={lite ? undefined : { opacity: 1, y: 0 }}
              transition={lite ? { duration: 0 } : { duration: 0.5 }}
              className="space-y-5"
            >
              <div className="glass-card rounded-2xl p-6 border-l-4 border-brand-navy dark:border-blue-400">
                <h3 className="font-semibold text-lg mb-2 text-brand-navy dark:text-white">Check your email</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We&apos;ve sent a password reset link to <strong className="text-brand-navy dark:text-white">{email}</strong>.
                  Please check your inbox and click the link to reset your password.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="block text-center text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium text-sm transition-colors duration-300"
              >
                Return to sign in
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={false}
                animate={lite ? undefined : { opacity: 1, y: 0 }}
                transition={lite ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
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
                disabled={isLoading}
                initial={false}
                animate={lite ? undefined : { opacity: 1, y: 0 }}
                transition={lite ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
                className="liquid-btn-red w-full rounded-2xl py-4 font-medium text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending reset link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </motion.button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
