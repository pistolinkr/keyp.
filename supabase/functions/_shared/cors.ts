/**
 * Set `FUNCTION_CORS_ORIGINS` in Supabase Edge secrets to a comma-separated list of exact
 * allowed origins (e.g. `https://app.example.com,https://www.example.com`). If unset, the
 * function allows `*` for local development — set this in production.
 */
export function corsHeadersForRequest(req: Request): Record<string, string> {
  const allowRaw = Deno.env.get("FUNCTION_CORS_ORIGINS")?.trim() ?? "";
  const allow = allowRaw ? allowRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (allow.length === 0) {
    return { ...base, "Access-Control-Allow-Origin": "*" };
  }
  const origin = req.headers.get("Origin");
  if (origin && allow.includes(origin)) {
    return { ...base, "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  if (!origin) {
    return { ...base, "Access-Control-Allow-Origin": allow[0]! };
  }
  return { ...base };
}
