"use client";

import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Full path including query, e.g. from `buildAuthHref("/sign-in", redirectPath)` */
  signInHref?: string;
  signUpHref?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = "Authentication Required",
  description = "You need to sign in with your Queen's University account to access this feature.",
  signInHref,
  signUpHref,
}: AuthModalProps) {
  const router = useRouter();

  const handleSignIn = () => {
    router.push(signInHref ?? "/sign-in");
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="glass-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="glass-modal-panel max-w-md w-full rounded-[1.75rem] p-0 relative">
            <button
              className="glass-modal-close absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-brand-navy/55 dark:text-white/55 hover:text-brand-red"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="p-6 pb-5">
              <div className="glass-modal-accent h-1.5 w-24 rounded-full mb-5 opacity-90" />
              <h2 className="text-2xl font-bold text-brand-navy dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-navy/70 dark:text-white/70">{description}</p>
            </div>

            <div className="px-6 pb-6">
              <div className="glass-card rounded-2xl p-4 mb-6">
                <p className="text-sm leading-6 text-brand-navy/78 dark:text-white/78">
                  Only Queen's University students with a valid @queensu.ca email address can access this feature.
                </p>
              </div>

              {signUpHref ? (
                <p className="mb-4 text-center text-sm text-brand-navy/65 dark:text-white/60">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(signUpHref);
                      onClose();
                    }}
                    className="font-medium text-brand-red hover:text-brand-navy dark:hover:text-white"
                  >
                    Create an account
                  </button>
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="liquid-btn-red rounded-2xl px-6 py-3 text-sm font-medium text-white"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 