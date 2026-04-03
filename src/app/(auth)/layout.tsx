import { Suspense } from "react";

function AuthLoadingFallback() {
  return (
    <div className="flex flex-1 min-h-[50vh] items-center justify-center px-6">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-brand-navy/20 border-t-brand-navy dark:border-blue-400/20 dark:border-t-blue-400"
        aria-label="Loading"
      />
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<AuthLoadingFallback />}>{children}</Suspense>
    </div>
  );
} 