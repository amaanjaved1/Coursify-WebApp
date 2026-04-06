# Privacy Policy – Source Notes

**Last Updated:** April 2025  
**Status:** Reviewed against actual codebase behaviour

These notes document the rationale behind each section of the published Privacy Policy at `/privacy`. They serve as a traceability layer between the live policy and the real data flows in the application.

---

## Methodology

1. Codebase audit of all forms, API routes, database schemas, auth flows, and third-party SDKs.
2. Cross-reference with `docs/legal/data-inventory.md`.
3. Manual review for accuracy against actual Supabase schema and Next.js API routes.

No external policy generator was used; the policy was authored manually based on the audit findings.

---

## Section-by-Section Notes

### "What data we collect"
- **Email address**: collected at sign-up (`/sign-up`), validated against `@queensu.ca` domain. Source: `src/app/(auth)/sign-up/page.tsx`, `src/lib/auth/auth-context.tsx`.
- **Password**: collected at sign-up and sign-in; Supabase stores a bcrypt hash, never the plaintext value. No raw password is stored or logged by application code.
- **Display name**: optional, collected during onboarding and editable in settings. Source: `src/app/settings/page.tsx`, `src/app/onboarding/page.tsx`.
- **Semesters completed**: optional integer (0–8+). Source: same onboarding and settings pages.
- **Uploaded PDFs**: uploaded via `POST /api/upload-distribution`; stored in Supabase Storage. Source: `src/app/api/upload-distribution/route.ts`, `src/components/file-uploader.tsx`.
- **IP address / User-Agent**: passively captured by Vercel's hosting infrastructure; not explicitly stored in the application database.
- **Session tokens**: managed by Supabase Auth SDK; stored in browser cookies / local storage.

### "How we collect it"
- Directly from the user via forms (sign-up, onboarding, settings, file upload).
- Automatically by Vercel's edge network on every HTTP request.
- Automatically by Supabase when issuing and refreshing auth sessions.

### "Why we collect it"
- Email: authentication and platform-access gating (Queens students only).
- Password hash: credential verification.
- Display name / semesters: personalisation of the course feed.
- Uploaded PDFs: to extract grade-distribution data and improve course insights for all users.
- IP / User-Agent: inherent to serving a web application (Vercel access logs).
- Session tokens: to maintain logged-in state across page loads.

### "How we use it"
- Account management (authentication, password reset).
- Personalisation (display name, academic-level filtering).
- Platform improvement (processing uploaded grade PDFs).
- No user data is used for advertising or sold to third parties.

### "Whether we share it with third parties"
- **Supabase**: data processor for authentication, database, and storage. Data is processed on our behalf under Supabase's terms.
- **Vercel**: hosting provider that receives HTTP request metadata (IP, User-Agent) via normal access logs.
- No other third parties receive personal data.
- No data is sold.

### "How long we retain it"
- Account data (email, profile): retained while the account is active.
- Uploaded files and upload metadata: retained while the platform uses that data.
- Vercel access logs: per Vercel's defaults (~30 days).
- **TODO**: Implement a formal account-deletion workflow so users can request removal of all personal data.

### "User rights"
- Users can update display name and semesters-completed in Settings.
- Users can view their uploads in Settings.
- Full data deletion is not yet self-service; flagged as a follow-up item.
- GDPR / CCPA rights (access, deletion, portability) are acknowledged in the policy with a contact-email pathway.

### "Contact"
- Users can reach the team via the contact email listed on the About page.
- **TODO**: Establish a dedicated privacy@ email address.

### "GDPR / CCPA considerations"
- Coursify may have users from the EU or California given it is a publicly accessible website.
- The legal basis for processing under GDPR is **legitimate interests** (enabling students to access course data) and **performance of a contract** (authentication, account management).
- No data is sold (CCPA "Do Not Sell" requirement is therefore not triggered, but this is noted).
- Users may exercise data subject rights by contacting the team.

---

## Known Gaps / Follow-Up Items

- [ ] Dedicated privacy contact email address
- [ ] Self-service account deletion
- [ ] Formal data-processing agreement (DPA) review with Supabase
- [ ] Confirm Vercel log retention period
- [ ] If analytics are added in future, update this policy and add a cookie-consent mechanism
