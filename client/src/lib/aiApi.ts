type AiLang = "ko" | "en";

type AssistantHistory = Array<{ role: "user" | "assistant"; text: string }>;

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
  return postJson<{ summary: string }>("/api/ai/summary", input);
}

export async function requestAiAssistant(input: {
  message: string;
  content: string;
  title: string;
  lang: AiLang;
  history: AssistantHistory;
}) {
  return postJson<{ reply: string }>("/api/ai/assistant", input);
}

export async function requestAiTranslation(input: {
  text: string;
  sourceLang: AiLang;
  targetLang: AiLang;
}) {
  return postJson<{ translatedText: string }>("/api/ai/translate", input);
}
