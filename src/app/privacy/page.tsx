import Link from "next/link"
import type { Metadata } from "next"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "Privacy Policy – Coursify",
  description: "How Coursify collects, uses, and protects your personal information.",
}

const EFFECTIVE_DATE = "April 6, 2025"

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen overflow-x-clip pt-20">
      <div className="container pt-12 pb-16 px-4 md:px-6 lg:px-8 relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full static-glass-pill mb-4">
            <span className="text-sm font-semibold text-brand-navy dark:text-white">Legal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="text-brand-navy dark:text-white">Privacy </span>
            <span className="text-brand-red">Policy</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          {/* Intro */}
          <section>
            <p>
              Coursify (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website at{" "}
              <strong>coursifyqu.com</strong> (the &ldquo;Site&rdquo;). This Privacy Policy explains what personal
              information we collect, how we use it, and the choices you have. It applies to all visitors and
              registered users of the Site.
            </p>
            <p className="mt-3">
              <strong>
                Coursify is not affiliated with or endorsed by Queen&apos;s University. We are a student-built platform
                and are not acting as an agent of Queen&apos;s University in any capacity.
              </strong>
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 1. Data we collect */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">1. Information We Collect</h2>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              1.1 Information you provide directly
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Email address</strong> – collected when you create an account. We require a{" "}
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">@queensu.ca</code> address
                to verify Queen&apos;s University affiliation.
              </li>
              <li>
                <strong>Password</strong> – collected at sign-up and sign-in. Your password is never stored in
                plaintext; it is hashed by our authentication provider (Supabase) before storage.
              </li>
              <li>
                <strong>Display name</strong> – an optional name you may set during onboarding or in your account
                settings.
              </li>
              <li>
                <strong>Semesters completed</strong> – an optional academic-progress indicator (0–8+ semesters) you
                may provide during onboarding or in settings.
              </li>
              <li>
                <strong>Uploaded grade-distribution PDFs</strong> – if you choose to upload a grade-distribution
                document, the file and associated metadata (original filename, term, processing status) are stored on
                our platform.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              1.2 Information collected automatically
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>IP address and standard HTTP request headers</strong> (e.g., User-Agent, Accept-Language) –
                captured by our hosting provider, Vercel, as part of normal web-server access logs. We do not
                separately store or analyse this information at the application level.
              </li>
              <li>
                <strong>Authentication session tokens</strong> – managed by Supabase Auth and stored in your
                browser&apos;s cookies and/or local storage to keep you signed in across page loads.
              </li>
              <li>
                <strong>Theme preference</strong> – a light/dark mode preference stored locally in your browser.
                This never leaves your device.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              1.3 What we do NOT collect
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>No real name beyond an optional display name</li>
              <li>No phone number, address, or government ID</li>
              <li>No payment or billing information</li>
              <li>No location or GPS data</li>
              <li>No analytics events or behavioural tracking (no Google Analytics, PostHog, Mixpanel, or similar)</li>
              <li>No session recordings (no Hotjar or similar)</li>
              <li>No crash / error telemetry (no Sentry or similar)</li>
              <li>No advertising identifiers or ad pixels</li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 2. How we use it */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account management</strong> – to create, authenticate, and maintain your account, including
                password-reset emails.
              </li>
              <li>
                <strong>Access control</strong> – to verify that you hold a Queen&apos;s University email address before
                granting access to the platform.
              </li>
              <li>
                <strong>Personalisation</strong> – to tailor the course feed and recommendations based on your
                academic progress (semesters completed) and display name.
              </li>
              <li>
                <strong>Platform improvement</strong> – uploaded grade-distribution PDFs are parsed to extract
                statistical data (e.g., grade breakdowns, GPA averages) which is then surfaced to all users as
                anonymous aggregate course data.
              </li>
              <li>
                <strong>Security and abuse prevention</strong> – to detect and prevent fraudulent uploads or
                unauthorised access attempts.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> use your data for advertising, sell your data to third parties, or share it
              with anyone outside the processors listed below.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 3. Sharing */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">
              3. How We Share Your Information
            </h2>
            <p>
              We share personal data only with the following service providers who act as data processors on our
              behalf:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong>Supabase</strong> – our database, authentication, and file-storage provider. Your email,
                hashed password, profile data, and uploaded files are stored on Supabase infrastructure. Supabase
                operates under its own{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-red hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Vercel</strong> – our hosting and edge-network provider. Vercel receives standard HTTP
                request metadata (IP address, User-Agent) through normal server access logs. Vercel operates under
                its own{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-red hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </li>
            </ul>
            <p className="mt-3">No other third parties receive your personal data.</p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 4. Retention */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">4. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account data</strong> (email, display name, semesters completed) – retained while your
                account is active. To request deletion, contact us at the address below.
              </li>
              <li>
                <strong>Uploaded files and upload metadata</strong> – retained while the platform uses the extracted
                grade data to provide course insights. You can view your uploads at any time in{" "}
                <Link href="/settings" className="text-brand-red hover:underline">
                  Settings
                </Link>
                .
              </li>
              <li>
                <strong>Vercel access logs</strong> – retained per Vercel&apos;s default retention policies
                (approximately 30 days).
              </li>
              <li>
                <strong>Supabase infrastructure logs</strong> – retained per Supabase&apos;s default retention
                policies.
              </li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 5. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">5. Cookies and Local Storage</h2>
            <p>We use only essential cookies and browser storage:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <strong>Supabase session cookies / local storage</strong> (
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">sb-*</code>) – required
                to keep you signed in. These expire when you sign out or when the session token expires.
              </li>
              <li>
                <strong>Theme preference</strong> (
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">theme</code>) – stored in
                your browser&apos;s local storage to remember your light/dark mode preference. Never sent to our
                servers.
              </li>
            </ul>
            <p className="mt-3">
              We do not set any advertising, analytics, or non-essential third-party cookies. No cookie consent
              banner is currently required.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 6. Your rights */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">6. Your Rights</h2>
            <p>
              Depending on where you are located, you may have rights regarding your personal data, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <strong>Access</strong> – request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Correction</strong> – update your display name and academic profile directly in{" "}
                <Link href="/settings" className="text-brand-red hover:underline">
                  Settings
                </Link>
                .
              </li>
              <li>
                <strong>Deletion</strong> – request deletion of your account and associated personal data by
                contacting us. Note: grade-distribution data extracted from your uploads is retained in an anonymised
                aggregate form and cannot be individually attributed.
              </li>
              <li>
                <strong>Portability</strong> – request an export of your personal data.
              </li>
              <li>
                <strong>Objection / restriction</strong> – where applicable, object to or restrict certain processing
                of your data.
              </li>
            </ul>
            <p className="mt-3">
              <strong>GDPR (EU/EEA users):</strong> Our legal basis for processing your personal data is
              performance of a contract (account creation and authentication) and legitimate interests (providing
              course insights to Queen&apos;s students). You may lodge a complaint with your local supervisory
              authority.
            </p>
            <p className="mt-3">
              <strong>CCPA (California residents):</strong> We do not sell your personal information. California
              residents may request disclosure of collected data categories and specific pieces of data.
            </p>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the details in Section 8.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 7. Security */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">7. Security</h2>
            <p>
              We implement reasonable technical and organisational measures to protect your data, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>HTTPS-only access enforced by Vercel</li>
              <li>Password hashing by Supabase Auth (bcrypt)</li>
              <li>Row-level security (RLS) policies in Supabase so users can only access their own data</li>
              <li>
                Strict HTTP security headers (
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                  X-Frame-Options: DENY
                </code>
                ,{" "}
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                  X-Content-Type-Options: nosniff
                </code>
                , etc.)
              </li>
            </ul>
            <p className="mt-3">
              No method of transmission over the internet is 100% secure. We cannot guarantee absolute security of
              your data.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 8. Contact */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">8. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data,
              please reach out to us via the contact information on the{" "}
              <Link href="/about" className="text-brand-red hover:underline">
                About Us
              </Link>{" "}
              page.
            </p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              <em>
                Note: We are a student-built open-source project. We will do our best to respond to privacy requests
                in a timely manner, but we are not a commercial entity with dedicated legal or privacy staff.
              </em>
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 9. Changes */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last
              updated&rdquo; date at the top of this page. We encourage you to review this page periodically. Your
              continued use of the Site after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-black/[0.06] dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Also see our{" "}
              <Link href="/terms" className="text-brand-red hover:underline">
                Terms of Use
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
