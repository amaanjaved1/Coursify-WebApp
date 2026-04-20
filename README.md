# 📚 Coursify — Web app

## 💡 What is Coursify?

**Coursify** is a course-insights platform for Queen's University students. It features course grade distributions, relevant Reddit and RateMyProfessors comments, and also an AI Chatbot.

---

## 🔗 Related repositories

| Repository                                                           | Purpose                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Coursify-WebApp](https://github.com/CoursifyQU/Coursify-WebApp)     | Full stack application                                                                  |
| [Coursify-Scrapers](https://github.com/CoursifyQU/Coursify-Scrapers) | Scheduled data scrapers for the Queen's academic calendar, Reddit, and RateMyProfessors |
| [Coursify-RAG](https://github.com/amaanjaved1/Coursify-RAG)          | Queen's Answers - Our chatbot                                                           |

🌐 [**Live site**](https://www.coursify.ca/)

---

## 🛠️ Tech stack

- **Next.js**
- **React 18** & **TypeScript**
- **Tailwind CSS** — styling (with `tailwindcss-animate`, `@tailwindcss/typography`)
- **Radix UI** — accessible primitives (dialogs, dropdowns, tabs, etc.)
- **Supabase** — PostgreSQL (course and distribution data) and authentication
- **Redis** (optional) — Upstash REST; caches course list and related API responses
- **Framer Motion** — UI motion
- **Recharts** — charts for grade and stats visuals
- **Zod** & **React Hook Form** — forms and validation

🤖 The RAG / chat service is maintained in **Coursify-RAG** (Python / Flask), not in this repo.

---

## 🚀 Setup & development

**Prerequisites:** Node.js 20+ recommended, [Supabase CLI](https://supabase.com/docs/guides/cli) for database setup. Local Supabase (`supabase start`) requires [Docker Desktop](https://docs.docker.com/desktop/).

### 1. Clone and install

```bash
git clone https://github.com/CoursifyQU/Coursify-WebApp.git
cd Coursify-WebApp
npm install
```

### 2. Environment variables

Copy [.env.example](./.env.example) to `.env.local` and fill in:

| Variable | Required | Where to get it |
| -------- | -------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → **Project Settings → API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | **Project Settings → API → Legacy keys** tab → `anon` `public` |
| `SUPABASE_SERVICE_KEY` | Yes for uploads & `/api/me/*` | **Project Settings → API → Legacy keys** tab → `service_role` (server only, never in client bundle) |
| `UPSTASH_REDIS_REST_URL` | No | [Upstash](https://console.upstash.com/) Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | No | Same |

> **⚠️ Use the Legacy API keys, not the newer "Publishable / Secret" keys.** The publishable keys don't work with the Supabase database API. See [`.env.example`](./.env.example) for the exact mapping.

If you omit Upstash, the app still runs; API routes will skip caching and hit Supabase more often.

### 3. Database (new Supabase project)

Use your **own** Supabase project (free tier is fine). Schema and sample data live in this repo under `supabase/`.

1. Create a project at [supabase.com](https://supabase.com/).
2. From this repo, link and apply migrations (install CLI, then log in):

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. **Seed** sample courses and comments:

   - **Local (Docker):** `npm run db:reseed` — drops everything, re-applies migrations, and runs [`supabase/seed.sql`](./supabase/seed.sql).
   - **Remote:** `npm run db:seed-remote` — same as above but targets your linked Supabase project.
   - **Manual fallback:** after `db push`, open the Supabase **SQL Editor**, paste the contents of `supabase/seed.sql`, and run it once.

4. **Auth URLs:** In **Authentication → URL configuration**, set **Site URL** to `http://localhost:3000` and add redirect URL `http://localhost:3000/auth/callback` (password reset and email verification use this).

### 3.5 Auth emails (SMTP + templates)

Supabase confirmation links are “confirm on visit”. Some university/work email systems automatically scan links by visiting them, which can accidentally verify users without a real click.

This repo includes an in-app confirmation page (`/auth/confirm`) that only verifies after a button click.

1. In **Supabase Dashboard → Authentication → Email Templates → Confirm signup**, paste the HTML from `supabase/templates/confirmation.html`.
2. In **Authentication → URL configuration**, ensure **Site URL** matches your environment (the template uses `{{ .SiteURL }}`):
   - Local testing: `http://localhost:3000`
   - Production: `https://www.coursify.ca`
3. In **Authentication → URL configuration → Additional Redirect URLs**, allow both:
   - `https://www.coursify.ca/auth/callback`
   - `https://www.coursify.ca/auth/confirm`

**Staying up to date:** The schema is stable and changes infrequently. If it does change, maintainers will add new SQL under `supabase/migrations/` and update `supabase/seed.sql`. Contributors just `git pull` then `npm run db:reseed` (local) or `npm run db:seed-remote` (remote) to get the latest schema and data.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build` then `npm start`. Lint: `npm run lint`.

**npm scripts (Supabase):** `npm run db:start`, `npm run db:reset`, `npm run db:reseed`, `npm run db:seed-remote`, `npm run db:push` (wrap `npx supabase …`).

---

## 🤝 Contributing

Contributions are welcome.

- 🐛 **Issues** — Open an issue to describe bugs, ideas, or schema/API questions before large changes.
- 🔀 **Pull requests** — Keep changes focused; match existing patterns (TypeScript, App Router, Supabase usage).
- 🔐 **Security** — Do not commit real API keys or service role keys; use `.env.example` as a template only. Never paste secrets in issues or PRs.
