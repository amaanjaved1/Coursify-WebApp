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
- **Redis** — Caching the Queen's courses table
- **Framer Motion** — UI motion
- **Recharts** — charts for grade and stats visuals
- **Zod** & **React Hook Form** — forms and validation
- **Vercel** — typical deployment target (see `VERCEL_SETUP.md`)

🤖 The RAG / chat service is maintained in **Coursify-RAG** (Python / Flask), not in this repo.

---

## 🚀 Setup & development

1. **Clone the repository**

```bash
git clone https://github.com/CoursifyQU/Coursify-WebApp.git
cd Coursify-WebApp
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment variables**

Copy `env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (for server-side API routes that bypass RLS — required for full local API behaviour)

4. **Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build` then `npm start`. Lint: `npm run lint`.

📦 Additional deployment notes: see `VERCEL_SETUP.md`.

---

## 🤝 Contributing

Contributions are welcome.

- 🐛 **Issues** — Open an issue to describe bugs, ideas, or schema/API questions before large changes.
- 🔀 **Pull requests** — Keep changes focused; match existing patterns (TypeScript, App Router, Supabase usage).
- 🔐 **Security** — Do not commit real API keys or service role keys; use `env.example` as a template only.
