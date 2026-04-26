/**
 * Verifies the caller's Supabase access JWT for serverless (Vercel) and Node (Express).
 * Uses the anon key + getUser(jwt) — no service role required for verification.
 */

import { createClient, type User } from "@supabase/supabase-js";

const BEARER = /^Bearer\s+(.+)$/i;

function getBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = authorization.match(BEARER);
  return m?.[1]?.trim() || null;
}

export type AuthSuccess = { user: User };
export type AuthFailure = { error: string; status: number; body?: Record<string, unknown> };

/**
 * @param authorization - `Authorization` header value
 */
export async function verifySupabaseBearer(authorization: string | null): Promise<AuthSuccess | AuthFailure> {
  const token = getBearerToken(authorization);
  if (!token) {
    return { error: "unauthorized", status: 401, body: { error: "Authentication required" } };
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key || !url) {
    return {
      error: "misconfiguration",
      status: 503,
      body: { error: "AI auth is not configured on the server" },
    };
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: "invalid_token", status: 401, body: { error: "Invalid or expired session" } };
  }
  return { user: data.user };
}

export function isAiAuthDisabled(): boolean {
  const v = process.env.AI_DISABLE_AUTH?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
