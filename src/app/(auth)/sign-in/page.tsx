"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { getSafeRedirectPath, buildAuthHref } from "@/lib/auth/safe-redirect";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useMotionTier } from "@/lib/motion-prefs";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const lite = useMotionTier() === "lite";

  const nextPath = useMemo(
    () => getSafeRedirectPath(searchParams.get("redirect"), "/"),
    [searchParams],
  );

  useEffect(() => {
    if (searchParams.get("error") === "link_expired") {
      toast({
        title: "Verification link expired",
        description:
          "Your email link has expired or already been used. Please sign in or request a new link.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const signUpHref = useMemo(
    () => buildAuthHref("/sign-up", nextPath),
    [nextPath],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
      toast({
        title: "Success",
        description: "You have been signed in successfully",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
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
              Welcome
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Access your account and continue your journey with us
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your password"
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

            <div className="space-y-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                initial={false}
                animate={lite ? undefined : { opacity: 1, y: 0 }}
                transition={
                  lite ? { duration: 0 } : { duration: 0.5, delay: 0.45 }
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </motion.button>

              <motion.div
                className="flex flex-col items-center gap-3"
                initial={false}
                animate={lite ? undefined : { opacity: 1 }}
                transition={
                  lite ? { duration: 0 } : { duration: 0.5, delay: 0.5 }
                }
              >
                <Link
                  href={signUpHref}
                  className="w-full inline-flex items-center justify-center rounded-2xl py-4 text-sm font-medium text-brand-navy dark:text-white border border-brand-navy/20 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 dark:focus-visible:ring-blue-400/30"
                >
                  Create Account
                </Link>

                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Forgot your password?{" "}
                  <Link
                    href="/forgot-password"
                    className="text-brand-red hover:text-brand-navy dark:hover:text-blue-400 font-medium transition-colors duration-300"
                  >
                    Reset it here
                  </Link>
                </p>
              </motion.div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
