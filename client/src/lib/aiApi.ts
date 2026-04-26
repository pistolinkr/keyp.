import { supabase } from "@/lib/supabase";

type AiLang = "ko" | "en";

type AssistantHistory = Array<{ role: "user" | "assistant"; text: string }>;

async function authHeadersForAi(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  if (!session) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }
  if (session?.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }
  if (!session?.access_token) {
    return null;
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Origin only (e.g. https://api.example.com). Do not include /api/ai or /translate —
 * paths are appended as /api/ai/{summary|assistant|translate}.
 */
function normalizeAiApiBase(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let s = raw.trim().replace(/\/+$/, "");
  // Accept mistaken full paths like .../api/ai/translate
  s = s.replace(/\/api\/ai(?:\/[^/]*)?$/i, "");
  s = s.replace(/\/+$/, "");
  return s;
}

/** Same-origin by default. Set VITE_AI_API_BASE_URL when AI runs on another host (e.g. dedicated Node server). */
function aiApiUrl(path: "summary" | "assistant" | "translate"): string {
  const base = normalizeAiApiBase(import.meta.env.VITE_AI_API_BASE_URL as string | undefined);
  const prefix = base ? `${base}/api/ai` : "/api/ai";
  return `${prefix}/${path}`;
}

async function postJson<T>(url: string, payload: unknown, auth: Record<string, string> | null): Promise<T> {
  if (!auth && !import.meta.env.DEV) {
    throw new Error("Sign in to use the writing assistant and translation features.");
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    Object.assign(headers, auth);
  }
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await resp.json().catch(() => ({}))) as T & { error?: string };
  if (!resp.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request failed (${resp.status})`;
    throw new Error(message);
  }
  return data;
}

export async function requestAiSummary(input: { content: string; lang: AiLang }) {
  const auth = await authHeadersForAi();
  return postJson<{ summary: string }>(aiApiUrl("summary"), input, auth);
}

export async function requestAiAssistant(input: {
  message: string;
  content: string;
  title: string;
  lang: AiLang;
  history: AssistantHistory;
}) {
  const auth = await authHeadersForAi();
  return postJson<{ reply: string }>(aiApiUrl("assistant"), input, auth);
}

export async function requestAiTranslation(input: {
  text: string;
  sourceLang: AiLang;
  targetLang: AiLang;
}) {
  const auth = await authHeadersForAi();
  return postJson<{ translatedText: string }>(aiApiUrl("translate"), input, auth);
}
