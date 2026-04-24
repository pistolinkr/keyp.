import { handleAiPath, formatAiHttpError } from "../../shared/aiBackend";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
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
