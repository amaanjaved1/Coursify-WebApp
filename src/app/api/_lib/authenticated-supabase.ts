import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

type AuthenticatedSupabaseSuccess = {
  ok: true;
  supabase: SupabaseClient<Database>;
  user: User;
  token: string;
};

type AuthenticatedSupabaseFailure = {
  ok: false;
  reason: "server_configuration" | "missing_token" | "authentication_failed";
  error: string;
};

export type AuthenticatedSupabaseResult =
  | AuthenticatedSupabaseSuccess
  | AuthenticatedSupabaseFailure;

export async function getAuthenticatedSupabaseFromRequest(
  request: NextRequest,
): Promise<AuthenticatedSupabaseResult> {
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      ok: false,
      reason: "server_configuration",
      error: "Server configuration error",
    };
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return {
      ok: false,
      reason: "missing_token",
      error: "Unauthorized",
    };
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      reason: "authentication_failed",
      error: "Authentication failed",
    };
  }

  return {
    ok: true,
    supabase,
    user,
    token,
  };
}
