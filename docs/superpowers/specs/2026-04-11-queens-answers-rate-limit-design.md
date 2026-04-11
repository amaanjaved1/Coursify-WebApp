# Queen's Answers — Daily Question Limit & Tier System

_Date: 2026-04-11_

## Overview

Add a daily question limit to Queen's Answers that varies by the user's number of completed semesters. Rate limiting is enforced server-side using Upstash Redis (already integrated). The AI backend remains a mock — the infrastructure is built so Gemini 2.0 Flash can be swapped in with a one-line change later.

---

## Tier System

| Semesters completed | Daily limit |
|---|---|
| 0–1 | 2 questions/day |
| 2+ | 3 questions/day |

`semesters_completed` is already stored in `user_profiles` and available via the Supabase service client.

---

## Global Limit

**1,500 requests/day** — the free tier cap for Google Gemini 2.0 Flash. Hard ceiling shared across all users. Resets daily at midnight UTC.

---

## Data Layer (Redis)

Two key patterns:

```
qa:user:{userId}    → integer count, TTL = 24h rolling (set on first increment)
qa:global           → integer count, TTL = seconds until next midnight UTC (set on first increment)
```

On every chat request:
1. Check `qa:global` — if ≥ 1,500 → reject with `{ reason: "capacity" }`
2. Check `qa:user:{userId}` — if ≥ tier limit → reject with `{ reason: "rate_limit" }`
3. Run the mock
4. On success: `INCR` both counters; set `EXPIRE` on each key only when `newCount === 1` (new key)

The existing `redis` wrapper in `src/lib/redis.ts` already has `get`, `incr`, and `expire` — no changes needed to that file.

---

## API Routes

### `POST /api/queens-answers/chat`

**File:** `src/app/api/queens-answers/chat/route.ts`

**Auth:** `Authorization: Bearer <token>` — same Supabase service client pattern as `/api/me/access-status`.

**Request body:**
```ts
{ question: string }
```

**Response (success — 200):**
```ts
{ answer: string, remaining: number }
```

**Response (error):**
```ts
{ error: string, reason: "rate_limit" | "capacity" | "unauthorized" }
```

**Logic:**
1. Extract + validate Bearer token via Supabase `auth.getUser(token)`
2. Fetch `semesters_completed` from `user_profiles` — derive `tierLimit` (≤1 → 2, else → 3)
3. Read `qa:global` — reject if ≥ 1,500
4. Read `qa:user:{userId}` — reject if ≥ `tierLimit`
5. Run mock: 1.5–2.5s delay + placeholder string (TODO: replace with Gemini call)
6. `INCR qa:global`; if result is 1, set `EXPIRE` to seconds until next midnight UTC
7. `INCR qa:user:{userId}`; if result is 1, set `EXPIRE` to 86400
8. Return `{ answer, remaining: tierLimit - newUserCount }`

### `GET /api/queens-answers/status`

**File:** `src/app/api/queens-answers/status/route.ts`

Same auth pattern. Reads both counters without incrementing.

**Response (200):**
```ts
{
  dailyLimit: number,       // 2 or 3
  used: number,             // current qa:user:{userId} value (0 if key missing)
  remaining: number,
  globalUsed: number,       // current qa:global value (0 if key missing)
  globalLimit: 1500,
  globalRemaining: number
}
```

---

## Frontend Changes

### Queen's Answers page (`src/app/queens-answers/page.tsx`)

**State additions:**
- `remaining: number | null` — questions left for the user today
- `globalRemaining: number | null` — global requests left today
- `limitHit: "user" | "global" | null` — which limit (if any) is exhausted

**On load:** call `GET /api/queens-answers/status` (only when user is authenticated) to pre-populate the above state.

**`handleSubmitQuestion` update:** replace `mockSendMessage()` with `fetch('POST /api/queens-answers/chat')`.
- Success: update `remaining` from response; add bot reply to messages
- Error `reason: "rate_limit"`: set `limitHit = "user"`
- Error `reason: "capacity"`: set `limitHit = "global"`

**Stats line:** Small muted text rendered just below the fixed composer pill (always visible once authenticated, before and during chat). Shows: *"2 of 3 questions remaining today · 1,423 / 1,500 global"*. Hidden while auth or status is loading.

**Limit states (replace stats line text + disable input):**
- `limitHit === "user"`: *"You've used your X daily questions. Resets within 24 hours."*
- `limitHit === "global"`: *"Queen's Answers is at capacity for today. Check back tomorrow."*

**"How it works" modal:** Add a new section at the bottom of the existing modal explaining daily limits:
- Tier breakdown: *"0–1 semesters completed: 2 questions/day · 2+ semesters completed: 3 questions/day"*
- Why limits exist: Queen's Answers uses a free AI API plan to keep the service free for all students. The plan includes 1,500 requests per day shared across all users.

### Settings page (`src/app/settings/page.tsx`)

The "Queen's Answers Access" `glass-card` section is refactored from a single column to a **two-column grid** (`grid grid-cols-[3fr_2fr] gap-4`):

- **Left column:** existing `StatusBadge` + upload prompts — content unchanged
- **Right column:** new "Daily Question Limit" card showing:
  - Current limit (2 or 3 questions/day)
  - Used / remaining today (from `GET /api/queens-answers/status`, fetched in the existing `load()` call alongside the other three fetches)
  - Tier note: *"0–1 semesters: 2/day · 2+ semesters: 3/day"*

---

## What Is NOT in This Ticket

- Gemini 2.0 Flash integration — deferred. The mock remains.
- Per-question analytics or audit logging
- Admin dashboard for usage monitoring

---

## Future Swap-In Point

Inside `POST /api/queens-answers/chat`, replace:

```ts
// TODO: Replace with Gemini 2.0 Flash call
const delay = 1500 + Math.random() * 1000
await new Promise(resolve => setTimeout(resolve, delay))
const answer = "The AI is almost ready — we're putting it through its paces..."
```

with the Gemini SDK call. No other changes needed.
