import Link from "next/link"
import type { Metadata } from "next"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "Terms of Use – Coursify",
  description: "The rules and conditions that govern your use of the Coursify platform.",
}

const EFFECTIVE_DATE = "April 6, 2025"

export default function TermsOfUse() {
  return (
    <div className="relative min-h-screen overflow-x-clip pt-20">
      <div className="container pt-12 pb-16 px-4 md:px-6 lg:px-8 relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full static-glass-pill mb-4">
            <span className="text-sm font-semibold text-brand-navy dark:text-white">Legal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="text-brand-navy dark:text-white">Terms of </span>
            <span className="text-brand-red">Use</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          {/* Intro */}
          <section>
            <p>
              These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the Coursify website at{" "}
              <strong>coursifyqu.com</strong> (the &ldquo;Site&rdquo;) and any related services provided by
              Coursify (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing or using the Site,
              you agree to be bound by these Terms. If you do not agree, please do not use the Site.
            </p>
            <p className="mt-3">
              <strong>
                Coursify is not affiliated with or endorsed by Queen&apos;s University. We are a student-built,
                open-source project.
              </strong>
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 1. Eligibility */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">1. Eligibility</h2>
            <p>
              Coursify is intended for use by students enrolled at Queen&apos;s University. To create an account,
              you must have a valid Queen&apos;s University email address (ending in{" "}
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">@queensu.ca</code>).
              Visitors without an account may browse publicly available course and grade-distribution data.
            </p>
            <p className="mt-3">
              By creating an account, you represent that you are at least 13 years old and that you have the right to
              use the email address provided. If you are under 18, you represent that you have parental or guardian
              consent to use the Site.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 2. Acceptable Use */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">2. Acceptable Use</h2>
            <p>You may use the Site to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>Browse course listings, grade distributions, and course-insight data for Queen&apos;s University courses.</li>
              <li>Create and manage a personal account using your Queen&apos;s email address.</li>
              <li>Upload legitimately obtained grade-distribution PDFs from Queen&apos;s University.</li>
              <li>Use the AI chat assistant to ask questions about courses and professors.</li>
              <li>View and manage your account settings and uploaded content.</li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 3. Prohibited Conduct */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">3. Prohibited Conduct</h2>
            <p>You agree that you will not:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <strong>Upload false or manipulated data.</strong> You must not upload grade-distribution PDFs that
                have been altered, fabricated, or that you do not have the right to share.
              </li>
              <li>
                <strong>Attempt unauthorised access.</strong> You must not attempt to access other users&apos;
                accounts, data, or any restricted part of the Site or its underlying infrastructure.
              </li>
              <li>
                <strong>Circumvent access controls.</strong> You must not attempt to bypass the Queen&apos;s email
                requirement or any other access-control mechanism.
              </li>
              <li>
                <strong>Scrape or auto-crawl.</strong> You must not use bots, crawlers, scrapers, or automated tools
                to extract data from the Site in bulk without our prior written consent.
              </li>
              <li>
                <strong>Harm individuals.</strong> You must not use the Site or its content (including AI-generated
                responses or professor comments) to harass, defame, or harm any individual.
              </li>
              <li>
                <strong>Reverse-engineer the Site.</strong> You must not decompile, reverse-engineer, or attempt to
                extract the source code of non-public parts of the Site.
              </li>
              <li>
                <strong>Violate applicable law.</strong> You must not use the Site in any way that violates any
                applicable local, provincial, national, or international law or regulation.
              </li>
              <li>
                <strong>Transmit malicious content.</strong> You must not upload or transmit viruses, malware, or
                any other malicious code.
              </li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 4. Content Ownership and IP */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">
              4. Content Ownership and Intellectual Property
            </h2>
            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              4.1 Coursify content
            </h3>
            <p>
              The Coursify brand, logo, interface design, and original written content are owned by or licensed to
              Coursify. You may not reproduce, distribute, or create derivative works from Coursify&apos;s original
              content without prior written permission.
            </p>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              4.2 Queen&apos;s University course data
            </h3>
            <p>
              Course titles, descriptions, and requirements are sourced from publicly available Queen&apos;s
              University academic calendars. Coursify does not claim ownership of this data. Queen&apos;s University
              retains any rights it may have in its academic calendar content.
            </p>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              4.3 Third-party sourced content
            </h3>
            <p>
              Course comment data displayed on the Site is sourced from publicly available posts on Reddit and
              RateMyProfessors. We do not claim ownership of such content. Coursify is an independent project and is
              not affiliated with, endorsed by, or sponsored by these third-party platforms.
            </p>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              4.4 User-submitted content
            </h3>
            <p>
              Grade-distribution PDFs and other content you upload remain your property. By uploading content to the
              Site, you grant Coursify a non-exclusive, royalty-free, worldwide licence to process, display (in
              aggregated or anonymised form), and store that content for the purpose of providing the platform&apos;s
              services. You warrant that you have the right to share any content you upload.
            </p>

            <h3 className="text-base font-semibold text-brand-navy dark:text-white mt-4 mb-2">
              4.5 Open-source code
            </h3>
            <p>
              The Coursify web application source code is open-source and available on GitHub. Use of the source
              code is subject to the licence in the repository.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 5. AI Chat */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">5. AI Chat Assistant</h2>
            <p>
              The Site includes an AI-powered chat assistant (&ldquo;Coursify AI&rdquo;) trained on student comments
              sourced from Reddit and RateMyProfessors. You acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                AI-generated responses may be inaccurate, incomplete, outdated, or biased. Do not rely solely on
                AI responses to make academic decisions.
              </li>
              <li>
                The AI reflects the content of third-party comments and does not represent the views of Coursify or
                Queen&apos;s University.
              </li>
              <li>
                You must not attempt to use the AI to generate harmful, illegal, or defamatory content.
              </li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 6. Disclaimers */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">6. Disclaimers</h2>
            <p>
              <strong>THE SITE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND.</strong> To the fullest
              extent permitted by applicable law, Coursify disclaims all warranties, express or implied, including
              but not limited to warranties of merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <strong>Data accuracy:</strong> Grade-distribution data is crowdsourced and may be incomplete,
                incorrect, or out of date. Always verify course information through official Queen&apos;s University
                channels.
              </li>
              <li>
                <strong>No official affiliation:</strong> Coursify is not affiliated with or endorsed by
                Queen&apos;s University. Grades, professor ratings, and course insights on this platform do not
                represent official positions of the university.
              </li>
              <li>
                <strong>Availability:</strong> We do not guarantee that the Site will be available at all times or
                free from errors.
              </li>
            </ul>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 7. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">7. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, COURSIFY AND ITS CONTRIBUTORS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
              TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION
              WITH:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>your use of or inability to use the Site;</li>
              <li>any decisions you make based on data or AI responses from the Site;</li>
              <li>any unauthorised access to or alteration of your data;</li>
              <li>any conduct or content of any third party on the Site.</li>
            </ul>
            <p className="mt-3">
              In jurisdictions that do not allow the exclusion of certain warranties or limitation of liability, our
              liability is limited to the greatest extent permitted by law.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 8. Account Suspension / Termination */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">
              8. Account Suspension and Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without notice, if we
              reasonably believe you have violated these Terms or if your account has been inactive for an extended
              period. Upon termination, your right to access the Site ceases immediately.
            </p>
            <p className="mt-3">
              You may close your account at any time by contacting us. Refer to our{" "}
              <Link href="/privacy" className="text-brand-red hover:underline">
                Privacy Policy
              </Link>{" "}
              for information about how your data is handled upon account deletion.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Province of Ontario,
              Canada, without regard to its conflict-of-law provisions. Any disputes arising under these Terms shall
              be subject to the exclusive jurisdiction of the courts of Ontario, Canada.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 10. Changes */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will update the &ldquo;Last updated&rdquo;
              date at the top of this page. Your continued use of the Site after changes are posted constitutes your
              acceptance of the updated Terms. We encourage you to review this page periodically.
            </p>
          </section>

          <hr className="border-black/[0.06] dark:border-white/10" />

          {/* 11. Contact */}
          <section>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-3">11. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us via the information on the{" "}
              <Link href="/about" className="text-brand-red hover:underline">
                About Us
              </Link>{" "}
              page.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-black/[0.06] dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Also see our{" "}
              <Link href="/privacy" className="text-brand-red hover:underline">
                Privacy Policy
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
