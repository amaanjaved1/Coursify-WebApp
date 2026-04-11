# Daily Question Limit & Tier System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tiered, Redis-backed daily question limits (per-user + global) to Queen's Answers, gated server-side, with UI surfacing usage on the chat page and Settings.

**Architecture:** Two new Next.js API routes (`POST /api/queens-answers/chat`, `GET /api/queens-answers/status`) authenticate via Supabase service client (same pattern as `/api/me/access-status`). Rate limiting uses Upstash Redis with two key shapes: `qa:user:{userId}` (24h rolling TTL) and `qa:global` (TTL until midnight UTC). Tier comes from `user_profiles.semesters_completed`. The AI itself stays a mock — the spec is explicit that Gemini swap-in is a future ticket. Frontend reads status on load, disables input when limited, and updates from `remaining` returned by chat responses.

**Tech Stack:** Next.js App Router, TypeScript, Supabase service client, Upstash Redis (`@upstash/redis` via `src/lib/redis.ts`), React, Tailwind, Lucide icons.

**Project conventions noted from exploration:**
- No unit-test framework is wired into this repo (only `tests/reset-button-guard.mjs`). Verification per task is done by `npm run lint` + `npx tsc --noEmit` + manual smoke testing through the dev server, not automated unit tests.
- API routes follow the pattern in `src/app/api/me/access-status/route.ts` for auth.
- The redis wrapper in `src/lib/redis.ts` currently exposes only `get/set/del/delPattern` — it needs `incr` + `expire` + `ttl` added before rate limiting can work.

---

## File Structure

**Create:**
- `src/lib/queens-answers/rate-limit.ts` — pure rate-limit helper. Computes tier limit, runs Redis gate checks, increments counters, exposes a `readUsage(userId, semesters)` and `consumeQuestion(userId, semesters)` API. Single responsibility.
- `src/app/api/queens-answers/chat/route.ts` — `POST` handler: auth → fetch profile → consume → mock answer → respond.
- `src/app/api/queens-answers/status/route.ts` — `GET` handler: auth → fetch profile → read usage → respond.
- `src/components/queens-answers/usage-stats-blob.tsx` — small presentational component for the stats blob (global line + user line + info icon button). Keeps `page.tsx` from growing further.
- `src/components/queens-answers/limits-info-modal.tsx` — modal explaining tiers and why limits exist. Separated so the existing "How it works" modal in `page.tsx` is not entangled.
- `src/components/settings/daily-question-limit-card.tsx` — right-column card on Settings showing the user's daily limit + usage.

**Modify:**
- `src/lib/redis.ts` — add `incr`, `expire`, `ttl` wrappers (same try/catch pattern as existing methods).
- `src/app/queens-answers/page.tsx` — replace `mockSendMessage` with real fetch; load status on mount; render `<UsageStatsBlob>`; disable composer + send button when limited; surface error messages from server.
- `src/app/settings/page.tsx` — refactor "Queen's Answers Access" section into a two-column grid (left = existing access card, right = `<DailyQuestionLimitCard>`).

**Constants — defined once and reused:**
- `QA_GLOBAL_DAILY_LIMIT = 1500`
- `QA_TIER_LIMITS = { low: 2, high: 3 }` where `low` = 0–1 semesters, `high` = 2+
- Live in `src/lib/queens-answers/rate-limit.ts` and are exported.

**Shared response types** (defined in `src/lib/queens-answers/rate-limit.ts` and re-exported as needed):

```ts
export type QAUsage = {
  dailyLimit: number
  used: number
  remaining: number
  globalUsed: number
  globalLimit: number
  globalRemaining: number
}

export type QAConsumeResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "rate_limit" | "capacity"; usage: QAUsage }
```

---

## Task 1: Extend the Redis wrapper

**Files:**
- Modify: `src/lib/redis.ts`

- [ ] **Step 1: Add `incr`, `expire`, and `ttl` methods to the exported `redis` object**

In `src/lib/redis.ts`, append these methods inside the `export const redis = { ... }` object, immediately after `delPattern`:

```ts
  incr: async (key: string): Promise<number | null> => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.incr(key)
    } catch (err) {
      console.warn("[redis] incr failed:", err)
      return null
    }
  },
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await getRedis()?.expire(key, seconds)
    } catch (err) {
      console.warn("[redis] expire failed:", err)
    }
  },
  ttl: async (key: string): Promise<number | null> => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.ttl(key)
    } catch (err) {
      console.warn("[redis] ttl failed:", err)
      return null
    }
  },
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: clean exit (no new errors in `src/lib/redis.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/redis.ts
git commit -m "feat(redis): add incr/expire/ttl wrappers for rate limiting"
```

---

## Task 2: Build the rate-limit helper

**Files:**
- Create: `src/lib/queens-answers/rate-limit.ts`

- [ ] **Step 1: Write the helper module**

```ts
import { redis } from "@/lib/redis"

export const QA_GLOBAL_DAILY_LIMIT = 1500
export const QA_TIER_LIMITS = { low: 2, high: 3 } as const

export type QAUsage = {
  dailyLimit: number
  used: number
  remaining: number
  globalUsed: number
  globalLimit: number
  globalRemaining: number
}

export type QAConsumeResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "rate_limit" | "capacity"; usage: QAUsage }

export function tierLimitForSemesters(semesters: number | null | undefined): number {
  if (semesters == null) return QA_TIER_LIMITS.low
  return semesters >= 2 ? QA_TIER_LIMITS.high : QA_TIER_LIMITS.low
}

function userKey(userId: string) {
  return `qa:user:${userId}`
}
const GLOBAL_KEY = "qa:global"
const ROLLING_USER_TTL_SECONDS = 24 * 60 * 60

/** Seconds remaining until next midnight UTC. Always >= 1. */
export function secondsUntilMidnightUTC(now: Date = new Date()): number {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ))
  return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000))
}

async function readCount(key: string): Promise<number> {
  const v = await redis.get<number | string>(key)
  if (v == null) return 0
  return typeof v === "number" ? v : Number(v) || 0
}

export async function readUsage(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAUsage> {
  const dailyLimit = tierLimitForSemesters(semesters)
  const [used, globalUsed] = await Promise.all([
    readCount(userKey(userId)),
    readCount(GLOBAL_KEY),
  ])
  return {
    dailyLimit,
    used,
    remaining: Math.max(0, dailyLimit - used),
    globalUsed,
    globalLimit: QA_GLOBAL_DAILY_LIMIT,
    globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalUsed),
  }
}

/**
 * Gate + increment. Order matters:
 *   1. Check global cap → reject "capacity" if hit
 *   2. Check user cap   → reject "rate_limit" if hit
 *   3. INCR both counters
 *   4. Set TTLs on first write of each key (when previous count was 0)
 */
export async function consumeQuestion(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAConsumeResult> {
  const dailyLimit = tierLimitForSemesters(semesters)
  const uKey = userKey(userId)

  const [usedBefore, globalBefore] = await Promise.all([
    readCount(uKey),
    readCount(GLOBAL_KEY),
  ])

  if (globalBefore >= QA_GLOBAL_DAILY_LIMIT) {
    return {
      ok: false,
      reason: "capacity",
      usage: {
        dailyLimit,
        used: usedBefore,
        remaining: Math.max(0, dailyLimit - usedBefore),
        globalUsed: globalBefore,
        globalLimit: QA_GLOBAL_DAILY_LIMIT,
        globalRemaining: 0,
      },
    }
  }

  if (usedBefore >= dailyLimit) {
    return {
      ok: false,
      reason: "rate_limit",
      usage: {
        dailyLimit,
        used: usedBefore,
        remaining: 0,
        globalUsed: globalBefore,
        globalLimit: QA_GLOBAL_DAILY_LIMIT,
        globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalBefore),
      },
    }
  }

  const [usedAfter, globalAfter] = await Promise.all([
    redis.incr(uKey),
    redis.incr(GLOBAL_KEY),
  ])

  // First write of this user key in the rolling window → set 24h TTL.
  if (usedBefore === 0) {
    await redis.expire(uKey, ROLLING_USER_TTL_SECONDS)
  }
  // First write of the global key today → set TTL until midnight UTC.
  if (globalBefore === 0) {
    await redis.expire(GLOBAL_KEY, secondsUntilMidnightUTC())
  }

  const used = usedAfter ?? usedBefore + 1
  const globalUsed = globalAfter ?? globalBefore + 1

  return {
    ok: true,
    usage: {
      dailyLimit,
      used,
      remaining: Math.max(0, dailyLimit - used),
      globalUsed,
      globalLimit: QA_GLOBAL_DAILY_LIMIT,
      globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalUsed),
    },
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queens-answers/rate-limit.ts
git commit -m "feat(qa): add Redis-backed rate-limit helper for Queen's Answers"
```

---

## Task 3: Create the chat API route

**Files:**
- Create: `src/app/api/queens-answers/chat/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { consumeQuestion } from "@/lib/queens-answers/rate-limit"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

export async function POST(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error", reason: "unauthorized" },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized", reason: "unauthorized" },
      { status: 401 },
    )
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication failed", reason: "unauthorized" },
      { status: 401 },
    )
  }

  let body: { question?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", reason: "unauthorized" },
      { status: 400 },
    )
  }
  const question = typeof body.question === "string" ? body.question.trim() : ""
  if (!question) {
    return NextResponse.json(
      { error: "Question is required", reason: "unauthorized" },
      { status: 400 },
    )
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  const result = await consumeQuestion(user.id, profile?.semesters_completed)

  if (!result.ok) {
    const status = result.reason === "capacity" ? 503 : 429
    const message =
      result.reason === "capacity"
        ? "Queen's Answers is at capacity for today. Check back tomorrow."
        : `You've used your ${result.usage.dailyLimit} daily questions. Resets within 24 hours.`
    return NextResponse.json(
      { error: message, reason: result.reason, usage: result.usage },
      { status },
    )
  }

  // TODO: Replace with Gemini 2.0 Flash call
  const delay = 1500 + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))
  const answer = "The AI is almost ready — we're putting it through its paces..."

  return NextResponse.json({
    answer,
    remaining: result.usage.remaining,
    usage: result.usage,
  })
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint -- src/app/api/queens-answers`
Expected: clean exit.

- [ ] **Step 3: Manually smoke-test the route**

Start dev server (`npm run dev`) in another terminal. Sign in to the app, open DevTools → Network → copy the `Authorization: Bearer …` value from any `/api/me/access-status` request. Then:

```bash
curl -X POST http://localhost:3000/api/queens-answers/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"smoke test"}'
```

Expected: 200 with `{ answer, remaining, usage }`. Repeat past your tier limit → expect 429 with `reason: "rate_limit"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/queens-answers/chat/route.ts
git commit -m "feat(qa): add POST /api/queens-answers/chat with rate limiting"
```

---

## Task 4: Create the status API route

**Files:**
- Create: `src/app/api/queens-answers/status/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { readUsage } from "@/lib/queens-answers/rate-limit"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

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

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  const usage = await readUsage(user.id, profile?.semesters_completed)
  return NextResponse.json(usage)
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint -- src/app/api/queens-answers`
Expected: clean exit.

- [ ] **Step 3: Smoke-test**

```bash
curl http://localhost:3000/api/queens-answers/status -H "Authorization: Bearer <token>"
```

Expected: 200 with `{ dailyLimit, used, remaining, globalUsed, globalLimit, globalRemaining }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/queens-answers/status/route.ts
git commit -m "feat(qa): add GET /api/queens-answers/status"
```

---

## Task 5: Build the limits info modal component

**Files:**
- Create: `src/components/queens-answers/limits-info-modal.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { AnimatePresence, motion } from "framer-motion"
import { createPortal } from "react-dom"

type Props = { open: boolean; onClose: () => void }

export function LimitsInfoModal({ open, onClose }: Props) {
  if (typeof document === "undefined") return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-modal-overlay modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass-modal-panel relative my-auto w-full max-w-md rounded-[1.5rem] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="glass-modal-close absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-2xl font-bold text-brand-navy/55 dark:text-white/55 hover:text-brand-red"
            >
              &times;
            </button>
            <h2 className="mb-3 text-xl font-bold text-brand-navy dark:text-white">
              About daily question limits
            </h2>
            <div className="space-y-3 text-sm text-brand-navy/80 dark:text-white/80 leading-relaxed">
              <div>
                <div className="font-semibold text-brand-navy dark:text-white mb-1">Your limit depends on your progress</div>
                <p>0–1 semesters completed: <strong>2 questions/day</strong></p>
                <p>2+ semesters completed: <strong>3 questions/day</strong></p>
              </div>
              <div>
                <div className="font-semibold text-brand-navy dark:text-white mb-1">Why limits exist</div>
                <p>
                  Queen&apos;s Answers uses a free AI API plan to keep the service free for all
                  students. The plan includes <strong>1,500 requests per day</strong> shared across all
                  users.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/queens-answers/limits-info-modal.tsx
git commit -m "feat(qa): add limits info modal component"
```

---

## Task 6: Build the usage stats blob component

**Files:**
- Create: `src/components/queens-answers/usage-stats-blob.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { Info } from "lucide-react"
import type { QAUsage } from "@/lib/queens-answers/rate-limit"

type Props = {
  usage: QAUsage | null
  onInfoClick: () => void
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US")
}

export function UsageStatsBlob({ usage, onInfoClick }: Props) {
  if (!usage) {
    return (
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 mb-3 text-xs text-brand-navy/50 dark:text-white/50">
        Loading usage…
      </div>
    )
  }

  const userLimited = usage.remaining <= 0
  const globalLimited = usage.globalRemaining <= 0

  let blockMessage: string | null = null
  if (globalLimited) {
    blockMessage = "Queen's Answers is at capacity for today. Check back tomorrow."
  } else if (userLimited) {
    blockMessage = `You've used your ${usage.dailyLimit} daily questions. Resets within 24 hours.`
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 mb-3">
      <div
        className={`glass-card rounded-2xl px-4 py-3 flex items-start gap-3 ${
          blockMessage ? "ring-1 ring-brand-red/40" : ""
        }`}
      >
        <div className="flex-1 min-w-0 text-sm">
          <div className="text-brand-navy/75 dark:text-white/75">
            {formatNumber(usage.globalRemaining)} / {formatNumber(usage.globalLimit)} global requests available today
          </div>
          <div className="mt-0.5 font-medium text-brand-navy dark:text-white">
            {usage.remaining} of {usage.dailyLimit} questions remaining today
          </div>
          {blockMessage && (
            <div className="mt-1.5 text-sm font-semibold text-brand-red">
              {blockMessage}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onInfoClick}
          aria-label="About daily question limits"
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-brand-navy/60 dark:text-white/60 hover:text-brand-red hover:bg-brand-navy/5 dark:hover:bg-white/10 transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/queens-answers/usage-stats-blob.tsx
git commit -m "feat(qa): add usage stats blob component"
```

---

## Task 7: Wire chat page to real API + stats blob + disabled states

**Files:**
- Modify: `src/app/queens-answers/page.tsx`

- [ ] **Step 1: Add imports near the existing imports block**

In `src/app/queens-answers/page.tsx`, add to the existing import block at the top:

```tsx
import { supabase } from "@/lib/supabase/client"
import { UsageStatsBlob } from "@/components/queens-answers/usage-stats-blob"
import { LimitsInfoModal } from "@/components/queens-answers/limits-info-modal"
import type { QAUsage } from "@/lib/queens-answers/rate-limit"
```

Note: confirm the supabase client export path before pasting — grep `src/lib/supabase` and use whatever module the rest of the app uses (the access-status fetch in `src/app/settings/page.tsx` shows the established pattern via `await supabase.auth.getSession()`). If the path differs, use that path instead.

- [ ] **Step 2: Delete the `mockSendMessage` function**

Remove lines 29–40 of `src/app/queens-answers/page.tsx` (the `// TODO: Remove artificial delay…` comment block + the entire `mockSendMessage` function). The mock now lives server-side in the chat route.

- [ ] **Step 3: Add usage state + limits modal state inside `AIFeatures`**

Add these alongside the existing `useState` declarations near the top of the `AIFeatures` component:

```tsx
  const [usage, setUsage] = useState<QAUsage | null>(null)
  const [limitsModalOpen, setLimitsModalOpen] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
```

- [ ] **Step 4: Add a `useEffect` to fetch status on mount (when authed)**

Add this effect alongside the other `useEffect`s in `AIFeatures`:

```tsx
  useEffect(() => {
    if (authLoading || !user) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token
        if (!token) return
        const res = await fetch("/api/queens-answers/status", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data: QAUsage = await res.json()
        if (!cancelled) setUsage(data)
      } catch {
        /* non-fatal */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, user])
```

- [ ] **Step 5: Replace `handleSubmitQuestion` body to call the chat API**

Replace the entire existing `handleSubmitQuestion` function (currently lines ~190–208) with:

```tsx
  const handleSubmitQuestion = async (questionText: string = question) => {
    if (needsAuthToAsk) {
      setAuthModalOpen(true)
      return
    }
    if (!questionText.trim()) return

    const userLimited = usage ? usage.remaining <= 0 : false
    const globalLimited = usage ? usage.globalRemaining <= 0 : false
    if (userLimited || globalLimited) return

    const userMsg: ChatMessage = { role: "user", text: questionText.trim() }
    setMessages((prev) => [...prev, userMsg])
    setQuestion("")
    setIsBotTyping(true)
    setLimitError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setLimitError("You need to be signed in.")
        return
      }
      const res = await fetch("/api/queens-answers/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: questionText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.usage) setUsage(data.usage)
        setLimitError(data?.error ?? "Something went wrong.")
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data?.error ?? "Something went wrong." },
        ])
        return
      }
      if (data?.usage) setUsage(data.usage)
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Network error — please try again." },
      ])
    } finally {
      setIsBotTyping(false)
    }
  }
```

- [ ] **Step 6: Compute `composerLocked` and apply it to textarea + send button**

Just above the `return (` of `AIFeatures`, add:

```tsx
  const composerLocked =
    !!usage && (usage.remaining <= 0 || usage.globalRemaining <= 0)
```

Then modify the textarea props (currently around line 360–384):
- Change `readOnly={showHowItWorks || needsAuthToAsk}` → `readOnly={showHowItWorks || needsAuthToAsk || composerLocked}`
- Change `disabled={showHowItWorks || authLoading}` → `disabled={showHowItWorks || authLoading || composerLocked}`

And the send button (around line 385–400):
- Change `disabled={showHowItWorks || authLoading || !question.trim()}` → `disabled={showHowItWorks || authLoading || composerLocked || !question.trim()}`

- [ ] **Step 7: Render the stats blob and the limits modal**

The blob should appear at the top of the chat area. Find the line `{messages.length > 0 && (` (around line 291) and **insert immediately above it**:

```tsx
        {user && !authLoading && (
          <UsageStatsBlob usage={usage} onInfoClick={() => setLimitsModalOpen(true)} />
        )}
```

Then, near the bottom of the JSX (just before the closing `</ContributionGate>` and after the existing `createPortal(...)` block), add:

```tsx
        <LimitsInfoModal open={limitsModalOpen} onClose={() => setLimitsModalOpen(false)} />
```

- [ ] **Step 8: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. Fix any unused-variable warnings (e.g. if `limitError` ends up unused, drop it — but it is referenced in step 5's error path so it should be fine).

- [ ] **Step 9: Manual smoke test in dev server**

1. `npm run dev`, open `/queens-answers` while signed in.
2. Stats blob renders with `2 of 2 questions remaining today` (or 3/3) and the global counter.
3. Click the info icon → modal opens, explains tiers and the 1,500/day cap.
4. Send a question → bot replies with the placeholder; counter drops by 1.
5. Send until the user limit is hit → composer + send button visibly disabled, blob shows the "You've used your X daily questions" message.
6. (Optional) In Upstash console, manually set `qa:global` to 1500 → reload page → blob shows the capacity message.

- [ ] **Step 10: Commit**

```bash
git add src/app/queens-answers/page.tsx
git commit -m "feat(qa): wire chat page to limits API with stats blob and disabled states"
```

---

## Task 8: Build the daily question limit card for Settings

**Files:**
- Create: `src/components/settings/daily-question-limit-card.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { QAUsage } from "@/lib/queens-answers/rate-limit"

// NOTE: Confirm the supabase client import path matches the rest of the app
// (settings/page.tsx already imports it — copy that exact path).

export function DailyQuestionLimitCard() {
  const [usage, setUsage] = useState<QAUsage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token
        if (!token) return
        const res = await fetch("/api/queens-answers/status", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          if (!cancelled) setError("Couldn't load usage.")
          return
        }
        const data: QAUsage = await res.json()
        if (!cancelled) setUsage(data)
      } catch {
        if (!cancelled) setError("Couldn't load usage.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Daily Question Limit
      </h2>
      {error ? (
        <span className="text-sm text-red-500">{error}</span>
      ) : !usage ? (
        <span className="text-sm text-gray-400">Loading…</span>
      ) : (
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500">Your current limit</div>
            <div className="text-lg font-semibold text-brand-navy dark:text-white">
              {usage.dailyLimit} questions/day
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500">Today</div>
            <div className="text-sm text-brand-navy dark:text-white">
              <strong>{usage.used}</strong> used · <strong>{usage.remaining}</strong> remaining
            </div>
          </div>
          <p className="mt-1 text-xs text-brand-navy/60 dark:text-white/60 leading-snug">
            0–1 semesters completed: 2 questions/day · 2+ semesters completed: 3 questions/day
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settings/daily-question-limit-card.tsx
git commit -m "feat(settings): add daily question limit card"
```

---

## Task 9: Two-column refactor of the Queen's Answers Access section in Settings

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Add the import**

Add to the existing import block at the top of `src/app/settings/page.tsx`:

```tsx
import { DailyQuestionLimitCard } from "@/components/settings/daily-question-limit-card"
```

- [ ] **Step 2: Wrap the existing access section in a two-column grid**

Locate the block currently rendered as `{/* Section 1: Access Status */}` (around line 236). It is currently a single `<div className="glass-card rounded-2xl p-5"> … </div>`. Replace **that single wrapper div with a grid** so that the existing card occupies the larger left column and the new card sits in the smaller right column.

Replace:

```tsx
        {/* Section 1: Access Status */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Queen&apos;s Answers Access
          </h2>
          {accessStatus ? (
            …existing inner content unchanged…
          ) : (
            <span className="text-sm text-gray-400">Loading…</span>
          )}
        </div>
```

With:

```tsx
        {/* Section 1: Access Status (left, larger) + Daily Limit (right, smaller) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Queen&apos;s Answers Access
            </h2>
            {accessStatus ? (
              …existing inner content unchanged…
            ) : (
              <span className="text-sm text-gray-400">Loading…</span>
            )}
          </div>
          <div className="md:col-span-1">
            <DailyQuestionLimitCard />
          </div>
        </div>
```

(The `…existing inner content unchanged…` placeholder above is shorthand — keep the actual existing JSX from lines ~242–266 verbatim. Do not paraphrase or trim it.)

Also widen the page container so the right column has room: in the same file, find `<div className="max-w-2xl mx-auto flex flex-col gap-6">` (around line 230) and change it to `<div className="max-w-3xl mx-auto flex flex-col gap-6">`.

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Manual smoke test**

`npm run dev`, sign in, visit `/settings`. Verify:
- The Queen's Answers Access section is now a 2-column row on `md+` and stacks on mobile.
- Right card shows the live limit + today's usage.
- The rest of the page (Academic Profile, Upload History, etc.) is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat(settings): two-column QA access section with daily limit card"
```

---

## Task 10: Final end-to-end verification

- [ ] **Step 1: Full type-check + lint + build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all clean.

- [ ] **Step 2: End-to-end smoke**

1. Fresh sign-in. Visit `/queens-answers`. Stats blob loads with full quota.
2. Ask a question. Counter decrements by 1; reply lands.
3. Burn through quota. Composer locks; blob shows user-limit message.
4. Visit `/settings`. Right card matches the chat page numbers.
5. In Upstash console, manually `DEL qa:user:<your-uuid>`. Reload `/queens-answers`. Quota restored.
6. Set `qa:global` to 1500 in Upstash. Reload `/queens-answers`. Composer locks; blob shows capacity message.
7. `DEL qa:global`. Reload. Back to normal.

- [ ] **Step 3: No commit needed unless fixes were made.**

---

## Out of scope (per spec)
- Gemini 2.0 Flash SDK integration / `GOOGLE_AI_API_KEY` env var / prompt construction. The mock answer in Task 3 is the deliberate placeholder; future ticket swaps it out at the marked block.
- Per-question analytics or audit logging.
- Admin dashboard for usage monitoring.
