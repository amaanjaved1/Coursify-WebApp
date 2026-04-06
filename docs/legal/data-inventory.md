# Coursify Data Inventory

**Last Updated:** April 2025  
**Purpose:** Source-of-truth document listing every data point collected by the Coursify web application.

---

## Overview

Coursify is a course analytics platform for Queen's University students. It collects a minimal set of user data to support account creation and personalisation. No external analytics or tracking SDKs are currently installed.

---

## Data Inventory Table

| Data Field | Where Collected | Required / Optional | Why Collected | Where Stored | Who Can Access | Sent to Third Parties | Retention Period | In Privacy Policy |
|---|---|---|---|---|---|---|---|---|
| **Email address** | Sign-up form (`/sign-up`) | Required | Account identity; must be a `@queensu.ca` address to verify Queen's affiliation | Supabase Auth (`auth.users`) | User (self), Supabase platform, service-role API routes | Supabase (processor) | While account is active; deleted on account deletion | ✅ |
| **Password (hashed)** | Sign-up / sign-in forms | Required | Authentication credential | Supabase Auth (bcrypt hash, never plaintext) | Supabase platform only | Supabase (processor) | While account is active | ✅ |
| **Display name** | Onboarding / Settings (`/settings`) | Optional | Personalisation, shown within the app | `user_profiles.display_name` (Supabase Postgres) | User (self), service-role API | None | While account is active | ✅ |
| **Semesters completed** | Onboarding / Settings | Optional | Personalisation of course recommendations | `user_profiles.semesters_completed` | User (self), service-role API | None | While account is active | ✅ |
| **Onboarding status flag** | Onboarding flow | System-generated | Tracks whether user has completed onboarding | `user_profiles.onboarding_completed` | Service-role API | None | While account is active | ✅ |
| **Profile timestamps** | Auto-generated on create/update | System-generated | Auditing, debugging | `user_profiles.created_at`, `updated_at` | Service-role API | None | While account is active | ✅ |
| **Uploaded PDF files** | Grade-distribution upload flow (`/settings`, `POST /api/upload-distribution`) | Optional | Crowdsourced grade data to improve the platform | Supabase Storage bucket | User (self), service-role API (for processing) | Supabase (processor) | Retained as long as the platform uses the data; users can see their uploads via `/settings` | ✅ |
| **Upload metadata** | Grade-distribution upload | System-generated | Tracks upload status and provenance | `distribution_uploads` table (user_id, file_path, original_filename, term, status, processed_at) | User (self), service-role API | None | Retained alongside account; removed on account deletion | ✅ |
| **IP address / request metadata** | All HTTP requests | Automatic | Server-side request handling; not explicitly stored by the application | Vercel edge logs (hosting provider) | Vercel platform | Vercel (hosting processor) | Per Vercel's data-retention defaults (~30 days for access logs) | ✅ |
| **Browser / device info (User-Agent, Accept headers)** | All HTTP requests | Automatic | Standard HTTP request headers; not explicitly stored by the application | Vercel edge logs | Vercel platform | Vercel (hosting processor) | Per Vercel's data-retention defaults | ✅ |
| **Supabase session tokens** | Browser (cookie / local storage) | System-generated | Maintains authenticated session | Browser storage + Supabase session management | User's browser, Supabase | Supabase (processor) | Until sign-out or session expiry | ✅ |

---

## Third-Party Data Processors

| Processor | Purpose | Data Received | Their Privacy Policy |
|---|---|---|---|
| **Supabase** | Database, authentication, and file storage | Email, hashed password, user profile data, uploaded files | https://supabase.com/privacy |
| **Vercel** | Hosting and edge network | IP address, User-Agent, request URLs (access logs) | https://vercel.com/legal/privacy-policy |

---

## Data NOT Collected

The following are common data points that Coursify does **not** collect:

- Real name (beyond an optional display name)
- Phone number
- Location / GPS data
- Payment or billing information
- Photos (beyond PDFs uploaded by users)
- Social login / OAuth tokens (no Google/GitHub sign-in)
- Third-party analytics events (no Google Analytics, PostHog, Mixpanel, etc.)
- Session recordings (no Hotjar or similar)
- Crash / error telemetry (no Sentry or similar)
- Advertising identifiers or ad pixels

---

## Cookies and Local Storage

| Identifier | Type | Purpose | Expiry |
|---|---|---|---|
| `sb-*` (Supabase session) | Cookie + Local Storage | Maintains authenticated session | Session duration / token expiry (~1 hour, refresh until sign-out) |
| Next.js theme preference (`theme`) | Local Storage | Stores light/dark mode preference | Indefinite (user browser) |

No non-essential or third-party tracking cookies are currently set.

---

## Unresolved Unknowns / Follow-Up Items

- [ ] **Supabase access logs**: Supabase itself may log query activity at the infrastructure level. Review Supabase's DPA for details.
- [ ] **Vercel log retention**: Confirm current access-log retention window in Vercel dashboard.
- [ ] **Deleted-account data**: Define and implement a formal account-deletion workflow that removes rows from `user_profiles`, `distribution_uploads`, and associated Supabase Auth entries.
- [ ] **RAG content (rag_chunks)**: The `rag_chunks` table stores scraped text from Reddit and RateMyProfessors. This is not user-provided data, but sourcing, licensing, and retention should be reviewed.
- [ ] **Cookie consent banner**: Currently no non-essential cookies are set; if analytics are added in the future, a consent banner will be required.
