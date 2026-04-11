# Queen's Answers Rate Limit & Tier System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Redis-backed daily question limit (2 or 3/day based on semesters completed, 1,500/day global) to Queen's Answers, surfaced in the chat page and Settings.

**Architecture:** Two new Next.js API routes handle rate-limit gating and status reads using the existing Upstash Redis wrapper. The Queen's Answers page replaces the mock function call with a real fetch, adds a stats line below the composer, and extends the "How it works" modal. The Settings page gains a second column in the QA access section showing daily usage.

**Tech Stack:** Next.js App Router API routes, Upstash Redis (`src/lib/redis.ts`), Supabase service client (same pattern as `/api/me/access-status`), React state, Lucide icons, Tailwind CSS.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/api/queens-answers/chat/route.ts` | POST — rate-limit gate + mock response |
| Create | `src/app/api/queens-answers/status/route.ts` | GET — read counters without incrementing |
| Modify | `src/app/queens-answers/page.tsx` | Wire up API, stats line, limit states, modal update |
| Modify | `src/app/settings/page.tsx` | Two-column QA section + daily limit card |

---

## Task 1: POST /api/queens-answers/chat route

**Files:**
- Create: `src/app/api/queens-answers/chat/route.ts`

- [ ] **Step 1: Create the file with auth, tier logic, gate checks, mock, and counter increments**

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

const GLOBAL_LIMIT = 1500
const GLOBAL_KEY = "qa:global"

function getTierLimit(semestersCompleted: number): number {
  return semestersCompleted <= 1 ? 2 : 3
}

function secondsUntilMidnightUTC(): number {
  const now = new Date()
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

export async function POST(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error", reason: "unauthorized" },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json({ error: "Unauthorized", reason: "unauthorized" }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication failed", reason: "unauthorized" },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  const semestersCompleted = profile?.semesters_completed ?? 0
  const tierLimit = getTierLimit(semestersCompleted)
  const userKey = `qa:user:${user.id}`

  // Read both counters in parallel before deciding
  const [globalCount, userCount] = await Promise.all([
    redis.get<number>(GLOBAL_KEY),
    redis.get<number>(userKey),
  ])

  if ((globalCount ?? 0) >= GLOBAL_LIMIT) {
    return NextResponse.json(
      {
        error: "Queen's Answers is at capacity for today. Check back tomorrow.",
        reason: "capacity",
      },
      { status: 429 }
    )
  }

  if ((userCount ?? 0) >= tierLimit) {
    return NextResponse.json(
      {
        error: `You've used your ${tierLimit} daily questions. Resets within 24 hours.`,
        reason: "rate_limit",
      },
      { status: 429 }
    )
  }

  let question: string
  try {
    const body = await request.json()
    question = typeof body.question === "string" ? body.question.trim() : ""
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", reason: "unauthorized" },
      { status: 400 }
    )
  }

  if (!question) {
    return NextResponse.json(
      { error: "Question is required", reason: "unauthorized" },
      { status: 400 }
    )
  }

  // TODO: Replace with Gemini 2.0 Flash call
  const delay = 1500 + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))
  const answer =
    "The AI is almost ready — we're putting it through its paces before course selection. For now, head over to the course explorer and upload your grade distros to get a head start!"

  // Increment counters — set TTL only on first write (newCount === 1)
  const newGlobalCount = await redis.incr(GLOBAL_KEY)
  if (newGlobalCount === 1) {
    await redis.expire(GLOBAL_KEY, secondsUntilMidnightUTC())
  }

  const newUserCount = await redis.incr(userKey)
  if (newUserCount === 1) {
    await redis.expire(userKey, 86400)
  }

  return NextResponse.json({ answer, remaining: tierLimit - newUserCount })
}
```

- [ ] **Step 2: Verify the route responds correctly with curl (dev server must be running)**

Test unauthorized (expect 401):
```bash
curl -s -X POST http://localhost:3000/api/queens-answers/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}' | jq .
```
Expected: `{"error":"Unauthorized","reason":"unauthorized"}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/queens-answers/chat/route.ts
git commit -m "feat: add POST /api/queens-answers/chat with Redis rate limiting"
```

---

## Task 2: GET /api/queens-answers/status route

**Files:**
- Create: `src/app/api/queens-answers/status/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

const GLOBAL_LIMIT = 1500
const GLOBAL_KEY = "qa:global"

function getTierLimit(semestersCompleted: number): number {
  return semestersCompleted <= 1 ? 2 : 3
}

export async function GET(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  const semestersCompleted = profile?.semesters_completed ?? 0
  const dailyLimit = getTierLimit(semestersCompleted)
  const userKey = `qa:user:${user.id}`

  const [globalUsed, used] = await Promise.all([
    redis.get<number>(GLOBAL_KEY),
    redis.get<number>(userKey),
  ])

  const globalUsedNum = globalUsed ?? 0
  const usedNum = used ?? 0

  return NextResponse.json({
    dailyLimit,
    used: usedNum,
    remaining: Math.max(0, dailyLimit - usedNum),
    globalUsed: globalUsedNum,
    globalLimit: GLOBAL_LIMIT,
    globalRemaining: Math.max(0, GLOBAL_LIMIT - globalUsedNum),
  })
}
```

- [ ] **Step 2: Verify the route responds correctly with curl (dev server must be running)**

Test unauthorized (expect 401):
```bash
curl -s http://localhost:3000/api/queens-answers/status | jq .
```
Expected: `{"error":"Unauthorized"}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/queens-answers/status/route.ts
git commit -m "feat: add GET /api/queens-answers/status route"
```

---

## Task 3: Queen's Answers page — API wiring + stats line + limit states

**Files:**
- Modify: `src/app/queens-answers/page.tsx`

This task touches the `AIFeatures` component. Read the file before editing.

- [ ] **Step 1: Add new state variables and the `Info` icon import**

At the top of the file, add `Info` to the lucide-react import:
```ts
import { ArrowUp, Brain, Hammer, Search, MessageSquare, Target, Info } from "lucide-react"
```

Inside `AIFeatures`, after the existing state declarations (after `const [isBotTyping, setIsBotTyping] = useState(false)`), add:
```ts
const [remaining, setRemaining] = useState<number | null>(null)
const [tierLimit, setTierLimit] = useState<number | null>(null)
const [globalRemaining, setGlobalRemaining] = useState<number | null>(null)
const [limitHit, setLimitHit] = useState<"user" | "global" | null>(null)
const [statusLoading, setStatusLoading] = useState(false)
```

- [ ] **Step 2: Add a `getToken` helper and `fetchStatus` function**

Add these two functions inside `AIFeatures`, after the state declarations. They use the existing `getSupabaseClient` import — add this import at the top of the file:
```ts
import { getSupabaseClient } from "@/lib/supabase/client"
```

Then add the helpers inside `AIFeatures`:
```ts
const getToken = useCallback(async (): Promise<string | null> => {
  const { data: session } = await getSupabaseClient().auth.getSession()
  return session?.session?.access_token ?? null
}, [])

const fetchStatus = useCallback(async () => {
  const token = await getToken()
  if (!token) return
  setStatusLoading(true)
  try {
    const res = await fetch("/api/queens-answers/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    setTierLimit(data.dailyLimit)
    setRemaining(data.remaining)
    setGlobalRemaining(data.globalRemaining)
    if (data.remaining <= 0) setLimitHit("user")
    if (data.globalRemaining <= 0) setLimitHit("global")
  } finally {
    setStatusLoading(false)
  }
}, [getToken])
```

- [ ] **Step 3: Fetch status on mount when user is ready**

Add a new `useEffect` after the existing ones (e.g. after the `sessionStorage` effect):
```ts
useEffect(() => {
  if (!user) return
  void fetchStatus()
}, [user, fetchStatus])
```

- [ ] **Step 4: Replace `mockSendMessage` in `handleSubmitQuestion`**

Replace the existing `handleSubmitQuestion` function body. Find this block:
```ts
    try {
      const reply = await mockSendMessage(questionText)
      setMessages((prev) => [...prev, { role: "bot", text: reply }])
    } finally {
      setIsBotTyping(false)
    }
```

Replace with:
```ts
    try {
      const token = await getToken()
      if (!token) {
        setIsBotTyping(false)
        return
      }
      const res = await fetch("/api/queens-answers/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: questionText }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.reason === "rate_limit") {
          setLimitHit("user")
        } else if (data.reason === "capacity") {
          setLimitHit("global")
        }
        setMessages((prev) => [...prev, { role: "bot", text: data.error ?? "Something went wrong." }])
        return
      }

      setMessages((prev) => [...prev, { role: "bot", text: data.answer }])
      setRemaining(data.remaining)
      if (data.remaining <= 0) setLimitHit("user")
    } finally {
      setIsBotTyping(false)
    }
```

- [ ] **Step 5: Add the stats line below the composer pill**

The composer `<div>` is inside a `fixed bottom-4` container. After the closing `</div>` of the composer (the one that wraps the textarea and send button), still inside the outer fixed container, add the stats line as a sibling below it:

Find the outer fixed container's closing `</div>` (the one with `style={{ zIndex: 30 }}`). Just before that closing tag, after the composer's closing `</div>`, insert:

```tsx
{/* Stats line — shown when authenticated and not loading */}
{user && !authLoading && !statusLoading && (
  <div className="mt-1.5 text-center text-[11px] text-brand-navy/45 dark:text-white/35 select-none px-2">
    {limitHit === "global" ? (
      <span>Queen&apos;s Answers is at capacity for today. Check back tomorrow.</span>
    ) : limitHit === "user" ? (
      <span>You&apos;ve used your {tierLimit} daily questions. Resets within 24 hours.</span>
    ) : remaining !== null && globalRemaining !== null ? (
      <span>
        {remaining} of {tierLimit} questions remaining today
        &nbsp;·&nbsp;
        {globalRemaining.toLocaleString()} / 1,500 global remaining
      </span>
    ) : null}
  </div>
)}
```

- [ ] **Step 6: Disable the input and send button when a limit is hit**

In the `<textarea>`, add `limitHit !== null` to the `disabled` and `readOnly` conditions:

Find:
```tsx
              readOnly={showHowItWorks || needsAuthToAsk}
```
Replace with:
```tsx
              readOnly={showHowItWorks || needsAuthToAsk || limitHit !== null}
```

Find:
```tsx
              disabled={showHowItWorks || authLoading}
```
Replace with:
```tsx
              disabled={showHowItWorks || authLoading || limitHit !== null}
```

For the send button, find:
```tsx
              disabled={showHowItWorks || authLoading || !question.trim()}
```
Replace with:
```tsx
              disabled={showHowItWorks || authLoading || !question.trim() || limitHit !== null}
```

- [ ] **Step 7: Verify manually in the browser**

Start the dev server (`npm run dev`), navigate to `/queens-answers`, sign in, and confirm:
- The stats line appears below the input box showing questions remaining
- Submitting a question calls the real API (check Network tab)
- Response appears in chat and remaining count decrements

- [ ] **Step 8: Commit**

```bash
git add src/app/queens-answers/page.tsx
git commit -m "feat: wire queens-answers page to chat API with stats line and limit states"
```

---

## Task 4: Queen's Answers page — "How it works" modal update

**Files:**
- Modify: `src/app/queens-answers/page.tsx`

- [ ] **Step 1: Add daily limits section to the modal**

Inside the `showHowItWorks` modal, find the closing `</ul>` of the `howItWorksItems` list. After it (still inside `<motion.div className="glass-modal-panel ..."`), insert:

```tsx
                  <div className="mt-4 border-t border-brand-navy/10 dark:border-white/10 pt-4">
                    <div className="text-xs font-semibold text-brand-navy/55 dark:text-white/50 uppercase tracking-wider mb-2">
                      Daily Limits
                    </div>
                    <ul className="space-y-1 text-xs text-brand-navy/70 dark:text-white/60 leading-relaxed">
                      <li>0–1 semesters completed: <span className="font-semibold text-brand-navy dark:text-white">2 questions/day</span></li>
                      <li>2+ semesters completed: <span className="font-semibold text-brand-navy dark:text-white">3 questions/day</span></li>
                    </ul>
                    <p className="mt-2 text-xs text-brand-navy/55 dark:text-white/45 leading-relaxed">
                      Queen&apos;s Answers uses a free AI API plan to keep the service free for all students. The plan includes 1,500 requests per day shared across all users.
                    </p>
                  </div>
```

- [ ] **Step 2: Verify in browser**

Click "Learn how Queen's Answers works >", scroll to the bottom of the modal, confirm the Daily Limits section appears.

- [ ] **Step 3: Commit**

```bash
git add src/app/queens-answers/page.tsx
git commit -m "feat: add daily limits section to how-it-works modal"
```

---

## Task 5: Settings page — two-column QA section + daily limit card

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Add `qaStatus` state**

Inside `SettingsPage`, after the existing `const [refreshing, setRefreshing] = useState(false)` line, add:

```ts
const [qaStatus, setQaStatus] = useState<{
  dailyLimit: number
  used: number
  remaining: number
  globalUsed: number
  globalLimit: number
  globalRemaining: number
} | null>(null)
```

- [ ] **Step 2: Fetch `/api/queens-answers/status` inside `load()`**

Inside the `load` function, find the `Promise.all` that fetches `profileRes`, `statusRes`, `uploadsRes`. Replace it with a four-way fetch that also retrieves QA status:

```ts
      const [profileRes, statusRes, uploadsRes, qaStatusRes] = await Promise.all([
        fetch("/api/me/academic-profile", { headers }),
        fetch("/api/me/access-status", { headers }),
        fetch("/api/me/uploads", { headers }),
        fetch("/api/queens-answers/status", { headers }),
      ])
```

Then after the existing `if (uploadsRes.ok)` block, add:
```ts
      if (qaStatusRes.ok) {
        setQaStatus(await qaStatusRes.json())
      }
```

- [ ] **Step 3: Refactor the Queen's Answers Access section to two columns**

Find the entire `{/* Section 1: Access Status */}` block — currently a single `glass-card`. Replace it with a two-column grid:

```tsx
        {/* Section 1: Queen's Answers Access */}
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-4 items-start">
          {/* Left: access status — unchanged content */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Queen&apos;s Answers Access
            </h2>
            {accessStatus ? (
              <div className="flex flex-col gap-3">
                <StatusBadge status={accessStatus} />
                {!accessStatus.needs_onboarding && (
                  <>
                    {!accessStatus.has_access && accessStatus.upload_count < accessStatus.required_uploads && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        You need {accessStatus.required_uploads - accessStatus.upload_count} more grade distribution{accessStatus.required_uploads - accessStatus.upload_count === 1 ? "" : "s"} to unlock Queen&apos;s Answers.{" "}
                        <Link href="/add-courses" className="font-medium underline hover:opacity-80">
                          Upload now →
                        </Link>
                      </p>
                    )}
                    {accessStatus.pending_seasonal_upload && accessStatus.upload_count >= accessStatus.required_uploads && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Your {accessStatus.due_term} grade distribution is now available on SOLUS. Upload it to maintain your Queen&apos;s Answers access.{" "}
                        <Link href="/add-courses" className="font-medium underline hover:opacity-80">
                          Upload now →
                        </Link>
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Loading…</span>
            )}
          </div>

          {/* Right: daily question limit */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Daily Question Limit
            </h2>
            {qaStatus ? (
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-2xl font-bold text-brand-navy dark:text-white">
                    {qaStatus.remaining}
                    <span className="text-sm font-normal text-gray-400 dark:text-gray-500"> / {qaStatus.dailyLimit} remaining</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-brand-navy/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-navy dark:bg-blue-400 transition-all"
                      style={{ width: `${Math.round((qaStatus.remaining / qaStatus.dailyLimit) * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mt-1">
                  0–1 semesters: 2/day · 2+ semesters: 3/day
                </p>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Loading…</span>
            )}
          </div>
        </div>
```

- [ ] **Step 4: Verify in browser**

Navigate to `/settings`, confirm:
- The QA access section is now two side-by-side cards on wider screens and stacked on mobile
- The right card shows the correct remaining count and a progress bar
- The tier note is visible at the bottom of the right card

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add daily question limit card to settings QA section"
```

---

## Done

All five tasks complete. The feature is fully wired:
- Rate limiting enforced server-side via Redis
- Stats visible below the chat input on the Queen's Answers page
- Daily limits documented inside the existing "How it works" modal
- Usage card visible in Settings alongside the existing access status card
