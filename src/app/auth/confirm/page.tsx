"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { useMotionTier } from "@/lib/motion-prefs";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  const lite = useMotionTier() === "lite";

  const tokenHash = searchParams.get("token_hash") || "";
  const type = searchParams.get("type") || "signup";
  const nextPath = useMemo(
    () => getSafeRedirectPath(searchParams.get("next"), "/onboarding"),
    [searchParams],
  );

  const [isVerifying, setIsVerifying] = useState(false);

  const verify = async () => {
    if (!tokenHash) {
      toast({
        title: "Invalid link",
        description: "This verification link is missing required information.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash: tokenHash,
      });

      if (error) {
        toast({
          title: "Couldn't verify email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email verified",
        description: "You're all set.",
        variant: "success",
      });
      router.replace(nextPath);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Couldn't verify email",
        description:
          error.message || "Something went wrong verifying your email.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
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
        <div className="glass-card rounded-3xl p-8 border border-white/20 dark:border-white/10">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-navy dark:text-white">
            Verify your email
          </h1>
          <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Welcome to Coursify —{" "}
              <span className="font-semibold">click the button below</span> to
              finish creating your account.
            </p>
            <p className="mt-2 text-sm text-gray-600/90 dark:text-gray-300/90">
              This extra step prevents email scanners from accidentally
              verifying accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={verify}
            disabled={isVerifying}
            className="liquid-btn-red w-full rounded-2xl py-4 font-medium text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {isVerifying ? "Verifying..." : "Verify & Enter"}
          </button>

          <div className="mt-6 space-y-3 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Didn&apos;t request this? You can safely close this tab and ignore
              the email.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
