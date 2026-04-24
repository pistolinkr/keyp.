type AiLang = "ko" | "en";

type AssistantHistory = Array<{ role: "user" | "assistant"; text: string }>;

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

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return postJson<{ summary: string }>(aiApiUrl("summary"), input);
}

export async function requestAiAssistant(input: {
  message: string;
  content: string;
  title: string;
  lang: AiLang;
  history: AssistantHistory;
}) {
  return postJson<{ reply: string }>(aiApiUrl("assistant"), input);
}

export async function requestAiTranslation(input: {
  text: string;
  sourceLang: AiLang;
  targetLang: AiLang;
}) {
  return postJson<{ translatedText: string }>(aiApiUrl("translate"), input);
}
