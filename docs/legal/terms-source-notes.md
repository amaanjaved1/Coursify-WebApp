# Terms of Use – Source Notes

**Last Updated:** April 2025  
**Status:** Reviewed against actual codebase behaviour

These notes document the rationale behind each section of the published Terms of Use at `/terms`. They serve as a traceability layer between the live terms and how the application actually works.

---

## Methodology

1. Codebase audit of all user-facing features and data flows.
2. Review of what users can do on the platform (read data, create accounts, upload PDFs, interact with AI chat).
3. Identification of liability areas unique to Coursify's model (scraped data, AI-generated responses, grade distributions).

---

## Section-by-Section Notes

### "Acceptable use"
- Coursify is intended for Queen's University students only (Queen's email address required for sign-up).
- Users may browse course data, grade distributions, and AI-generated course summaries.
- Users may upload grade-distribution PDFs from official Queen's University sources.
- Scraping, automated access, and reverse-engineering are prohibited.

### "Prohibited conduct"
Key prohibitions specific to Coursify:
- Uploading fabricated or manipulated grade-distribution PDFs.
- Attempting to access other users' accounts or data.
- Using the platform to harass, defame, or harm individuals (e.g., weaponising professor-review content).
- Circumventing the Queen's email gate to gain unauthorised access.
- Using the AI chat to generate harmful or illegal content.

### "Ownership of site content and IP"
- Course data (titles, descriptions, requirements) is sourced from publicly available Queen's University academic calendars. Coursify does not claim ownership of that data.
- Grade-distribution data is submitted by users who attest they have the right to share it.
- User-submitted content (uploaded PDFs, display names) remains the property of the user; by uploading, users grant Coursify a licence to process the data for platform purposes.
- AI-generated responses are derived from scraped third-party content (Reddit, RateMyProfessors); users should verify accuracy independently.
- Coursify's own code, branding, and UI are proprietary.

### "User-generated content"
- The primary UGC is uploaded grade-distribution PDFs.
- Users attest at upload time that they are sharing legitimately obtained data.
- Coursify processes uploaded PDFs to extract grade statistics; raw files are stored in Supabase Storage.
- Coursify reserves the right to reject or remove uploads that appear fraudulent or violate policy.

### "Disclaimers and limitation of liability"
Key risk areas for Coursify:
- **Data accuracy**: grade distributions are crowdsourced and may not reflect every section or professor. Do not make academic decisions based solely on this data.
- **AI accuracy**: the AI chat assistant is trained on third-party comments and may be incorrect, outdated, or biased.
- **Third-party content**: rag_chunks table contains scraped Reddit and RateMyProfessors comments. Coursify does not endorse or verify individual comments.
- **No affiliation**: Coursify is not affiliated with or endorsed by Queen's University. Official course and enrolment decisions should be made through official Queen's channels.

### "No warranty"
- Platform is provided "as is"; no guarantee of uptime, accuracy, or fitness for a particular purpose.
- Consistent with standard SaaS liability-limiting language.

### "Account termination"
- Coursify may suspend or terminate accounts that violate these terms.
- Accounts created with invalid or non-Queen's emails will be denied or removed.

### "Governing law"
- **TODO**: Confirm governing jurisdiction with the team. Placeholder: Ontario, Canada.
- Dispute resolution placeholder added.

### "Trademark / IP screening (Coursify name)"
**Basic screening results (performed April 2025):**
- Google search for "Coursify": returns this platform, a few unrelated "Coursify" businesses in unrelated verticals (corporate training), and some SEO articles. No direct competitor in the university course-analytics space.
- USPTO search for "COURSIFY": no registered trademark found in International Class 42 (software/platform services) as of the date of this writing. Recommend follow-up with a trademark lawyer before filing or scaling.
- **Finding**: No obvious blocking trademark conflict identified at this baseline level. Recommend formal trademark clearance search before scaling or seeking investment.

---

## Known Gaps / Follow-Up Items

- [ ] Confirm governing jurisdiction and law
- [ ] Formal trademark clearance search by a lawyer
- [ ] Define user-data deletion process and reference in both Terms and Privacy Policy
- [ ] Consider a DMCA / takedown policy given scraped third-party content
- [ ] Formal legal review of liability-limiting language
