"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { buildAuthHref, getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { Eye, EyeOff } from "lucide-react";
import { useMotionTier } from "@/lib/motion-prefs";

export default function SignUp() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [accountConflict, setAccountConflict] = useState(false);
  const { signUp } = useAuth();
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

  const isQueensEmail = (email: string) => email.endsWith("@queensu.ca");

  const resetAccount = async () => {
    if (!email) return;
    setIsResetting(true);
    try {
      const response = await fetch("/api/auth/reset-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to reset account");
      setAccountConflict(false);
      toast({
        title: "Account reset",
        description: "You can now try to sign up again",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error resetting account",
        description:
          error.message || "Failed to reset account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAccountConflict(false);

    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isQueensEmail(email)) {
      toast({
        title: "Invalid email domain",
        description:
          "Please use your Queen's University email address (@queensu.ca)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        if (
          error.message &&
          (error.message.includes("already registered") ||
            error.message.includes("already exists") ||
            error.message.includes("already taken"))
        ) {
          setAccountConflict(true);
          toast({
            title: "Account already exists",
            description:
              "This email is already registered. You can reset it or sign in instead.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setShowVerificationMessage(true);
      toast({
        title: "Verification email sent",
        description: "Please check your Queen's email to verify your account",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
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
        transition={
          lite ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="flex flex-col gap-7">
          {/* Heading */}
          <motion.div
            initial={false}
            animate={lite ? undefined : { opacity: 1, y: 0 }}
            transition={lite ? { duration: 0 } : { duration: 0.6, delay: 0.15 }}
          >
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-brand-navy dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your Queen&apos;s University email to get started
            </p>
          </motion.div>

          {showVerificationMessage ? (
            <motion.div
              initial={false}
              animate={lite ? undefined : { opacity: 1, y: 0 }}
              transition={lite ? { duration: 0 } : { duration: 0.5 }}
              className="space-y-5"
            >
              <div className="glass-card rounded-2xl p-6 border-l-4 border-brand-navy dark:border-blue-400">
                <h3 className="font-semibold text-lg mb-2 text-brand-navy dark:text-white">
                  Check your email
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  A verification link has been sent to{" "}
                  <strong className="text-brand-navy dark:text-white">
                    {email}
                  </strong>
                  . Please check your inbox and click the link to verify your
                  account.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                  We&apos;re currently experiencing high server load, so it may
                  take a little longer than usual to arrive. If you don&apos;t
                  see it, check your spam/junk folder and wait at least 2
                  minutes before trying again.
                </p>
              </div>
              <Link
                href={signInHref}
                className="block text-center text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium text-sm transition-colors duration-300"
              >
                Return to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              {accountConflict && (
                <motion.div
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={lite ? { duration: 0 } : { duration: 0.3 }}
                  className="glass-card rounded-2xl p-5 border-l-4 border-brand-gold"
                >
                  <h3 className="font-semibold text-sm text-brand-navy dark:text-white mb-1">
                    Account Conflict
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    An account with this email already exists or was previously
                    created.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetAccount}
                      disabled={isResetting}
                      className="text-brand-navy dark:text-white border-brand-gold/40 dark:border-brand-gold/40 hover:bg-brand-gold/10 dark:hover:bg-brand-gold/10 text-xs transition-all duration-300"
                    >
                      {isResetting ? "Processing..." : "Reset Account"}
                    </Button>
                    <Link href={signInHref}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-brand-navy dark:text-white border-brand-gold/40 dark:border-brand-gold/40 hover:bg-brand-gold/10 dark:hover:bg-brand-gold/10 text-xs transition-all duration-300"
                      >
                        Sign In Instead
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.25 }
                  }
                >
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Display Name
                  </label>
                  <div className="glass-card rounded-2xl transition-all duration-300 focus-within:border-brand-navy/30 dark:focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_3px_rgba(0,48,95,0.08)]">
                    <input
                      type="text"
                      placeholder="What do we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      maxLength={8}
                      className="w-full bg-transparent text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-4 rounded-2xl focus:outline-none"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.32 }
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

                <motion.div
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.35 }
                  }
                >
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Password
                  </label>
                  <div className="glass-card rounded-2xl relative transition-all duration-300 focus-within:border-brand-navy/30 dark:focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_3px_rgba(0,48,95,0.08)]">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-4 pr-12 rounded-2xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-brand-navy dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.45 }
                  }
                >
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Confirm Password
                  </label>
                  <div className="glass-card rounded-2xl relative transition-all duration-300 focus-within:border-brand-navy/30 dark:focus-within:border-blue-400/30 focus-within:shadow-[0_0_0_3px_rgba(0,48,95,0.08)]">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-4 pr-12 rounded-2xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-brand-navy dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  initial={false}
                  animate={lite ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.55 }
                  }
                  className="liquid-btn-red w-full rounded-2xl py-4 font-medium text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    "Sign Up"
                  )}
                </motion.button>

                <motion.p
                  className="text-center text-xs text-gray-400 dark:text-gray-500 px-2"
                  initial={false}
                  animate={lite ? undefined : { opacity: 1 }}
                  transition={
                    lite ? { duration: 0 } : { duration: 0.5, delay: 0.58 }
                  }
                >
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-brand-navy dark:text-gray-300 hover:text-brand-red transition-colors duration-200 underline underline-offset-2"
                  >
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-brand-navy dark:text-gray-300 hover:text-brand-red transition-colors duration-200 underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </motion.p>
              </form>

              <motion.p
                className="text-center text-sm text-gray-500 dark:text-gray-400"
                initial={false}
                animate={lite ? undefined : { opacity: 1 }}
                transition={
                  lite ? { duration: 0 } : { duration: 0.5, delay: 0.6 }
                }
              >
                Already have an account?{" "}
                <Link
                  href={signInHref}
                  className="text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium transition-colors duration-300"
                >
                  Sign in
                </Link>
              </motion.p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
