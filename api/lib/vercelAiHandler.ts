import { handleAiPath, formatAiHttpError } from "./aiBackend";
import { isAiAuthDisabled, verifySupabaseBearer } from "./verifySupabaseAuth";

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

/** In-memory; best-effort per instance (Vercel may scale to many). Pair with WAF/edge rate limits. */
const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;

function clientKey(request: Request): string {
  const h = request.headers;
  const xf = h.get("x-forwarded-for");
  if (xf) {
    return xf.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

function isWithinAiRateLimit(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const arr = (rateBuckets.get(key) || []).filter((t) => t > windowStart);
  if (arr.length >= RATE_MAX) {
    rateBuckets.set(key, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  return true;
}

/**
 * Vercel Node functions: default export must be an async function (Request) => Response.
 * Some runtimes mishandle `export default { fetch }` with the Vite preset and return 500.
 */
export function createVercelAiHandler(
  path: "/api/ai/summary" | "/api/ai/assistant" | "/api/ai/translate",
): (request: Request) => Promise<Response> {
  return async function vercelAiRoute(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }
    if (!isWithinAiRateLimit(clientKey(request))) {
      return jsonResponse({ error: "Too many requests" }, 429, {
        "Retry-After": "60",
      });
    }
    if (!isAiAuthDisabled()) {
      const result = await verifySupabaseBearer(request.headers.get("Authorization"));
      if (!("user" in result)) {
        return jsonResponse(result.body ?? { error: result.error }, result.status);
      }
    }
    try {
      const raw = await request.text();
      let payload: unknown = {};
      if (raw.trim()) {
        try {
          payload = JSON.parse(raw) as unknown;
        } catch {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }
      }
      const data = await handleAiPath(path, payload);
      return jsonResponse(data, 200);
    } catch (error) {
      const { status, json } = formatAiHttpError(error);
      return jsonResponse(json, status);
    }
  };
}
