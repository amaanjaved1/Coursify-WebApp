import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const exchangeCodeForSession = vi.hoisted(() => vi.fn())
const upsert = vi.hoisted(() => vi.fn())
const from = vi.hoisted(() => vi.fn(() => ({ upsert })))
const createServerClient = vi.hoisted(() => vi.fn(() => ({
  auth: { exchangeCodeForSession },
})))
const createClient = vi.hoisted(() => vi.fn(() => ({ from })))

vi.mock("@supabase/ssr", () => ({ createServerClient }))
vi.mock("@supabase/supabase-js", () => ({ createClient }))

const { GET } = await import("@/app/auth/callback/route")

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`)
}

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    process.env.SUPABASE_SERVICE_KEY = "service-key"
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_SERVICE_KEY
  })

  it("redirects direct visits without a code to sign in", async () => {
    const response = await GET(request("/auth/callback"))

    expect(response.headers.get("location")).toBe("http://localhost/sign-in")
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("redirects to onboarding when callback environment is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const response = await GET(request("/auth/callback?code=abc"))

    expect(response.headers.get("location")).toBe("http://localhost/onboarding")
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("exchanges a code and redirects to a safe next path", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          user_metadata: {},
        },
      },
      error: null,
    })

    const response = await GET(request("/auth/callback?code=abc&next=/settings"))

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc")
    expect(response.headers.get("location")).toBe("http://localhost/settings")
  })

  it("falls back to onboarding for unsafe next paths", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          user_metadata: {},
        },
      },
      error: null,
    })

    const response = await GET(request("/auth/callback?code=abc&next=https%3A%2F%2Fevil.example"))

    expect(response.headers.get("location")).toBe("http://localhost/onboarding")
  })

  it("redirects expired or invalid links back to sign in with an error", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("expired"),
    })

    const response = await GET(request("/auth/callback?code=expired"))

    expect(response.headers.get("location")).toBe("http://localhost/sign-in?error=link_expired")
  })

  it("persists display name metadata when the callback session includes it", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          user_metadata: { display_name: "Ada" },
        },
      },
      error: null,
    })

    await GET(request("/auth/callback?code=abc"))

    expect(createClient).toHaveBeenCalledWith(
      "https://supabase.test",
      "service-key",
      { auth: { persistSession: false } },
    )
    expect(from).toHaveBeenCalledWith("user_profiles")
    expect(upsert).toHaveBeenCalledWith(
      { id: "user-1", display_name: "Ada" },
      { onConflict: "id", ignoreDuplicates: false },
    )
  })
})
