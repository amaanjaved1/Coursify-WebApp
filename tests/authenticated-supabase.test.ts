import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getUser = vi.hoisted(() => vi.fn())
const createClient = vi.hoisted(() => vi.fn(() => ({
  auth: { getUser },
})))

vi.mock("server-only", () => ({}))
vi.mock("@supabase/supabase-js", () => ({ createClient }))

function request(authHeader?: string): NextRequest {
  const headers = new Headers()
  if (authHeader) {
    headers.set("Authorization", authHeader)
  }
  return new NextRequest("http://localhost/api/test", { headers })
}

async function loadHelper() {
  const mod = await import("@/app/api/_lib/authenticated-supabase")
  return mod.getAuthenticatedSupabaseFromRequest
}

describe("getAuthenticatedSupabaseFromRequest", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test"
    process.env.SUPABASE_SERVICE_KEY = "service-key"
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
  })

  it("returns server_configuration when Supabase server env is missing", async () => {
    delete process.env.SUPABASE_SERVICE_KEY
    const authenticate = await loadHelper()

    const result = await authenticate(request("Bearer token-1"))

    expect(result).toEqual({
      ok: false,
      reason: "server_configuration",
      error: "Server configuration error",
    })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns missing_token before creating a Supabase client", async () => {
    const authenticate = await loadHelper()

    const result = await authenticate(request())

    expect(result).toEqual({
      ok: false,
      reason: "missing_token",
      error: "Unauthorized",
    })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns authentication_failed when Supabase cannot resolve a user", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("invalid token"),
    })
    const authenticate = await loadHelper()

    const result = await authenticate(request("Bearer token-1"))

    expect(createClient).toHaveBeenCalledWith(
      "https://supabase.test",
      "service-key",
      { auth: { persistSession: false } },
    )
    expect(getUser).toHaveBeenCalledWith("token-1")
    expect(result).toEqual({
      ok: false,
      reason: "authentication_failed",
      error: "Authentication failed",
    })
  })

  it("returns the authenticated Supabase client, user, and token", async () => {
    const user = { id: "user-1", email: "ada@queensu.ca" }
    getUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    })
    const authenticate = await loadHelper()

    const result = await authenticate(request("Bearer token-1"))

    expect(result).toMatchObject({
      ok: true,
      user,
      token: "token-1",
    })
    expect(getUser).toHaveBeenCalledWith("token-1")
  })
})
