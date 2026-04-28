import type React from "react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/auth-context";
import OnboardingGuard from "@/components/onboarding-guard";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coursify",
  description:
    "A course insights platform built for Queen's University students - not affiliated with Queen's University",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={manrope.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
        >
          <AuthProvider>
            <OnboardingGuard>
              <div className="flex min-h-screen flex-col">
                <Navigation />
                <main className="flex-1">{children}</main>
              </div>
            </OnboardingGuard>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
