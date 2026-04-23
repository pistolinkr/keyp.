import type { Express, Request, Response } from "express";

type AiSummaryPayload = {
  content?: string;
  lang?: "ko" | "en";
};

type AiAssistantPayload = {
  message?: string;
  content?: string;
  title?: string;
  lang?: "ko" | "en";
  history?: Array<{ role: "user" | "assistant"; text: string }>;
};

type AiTranslatePayload = {
  text?: string;
  sourceLang?: "ko" | "en";
  targetLang?: "ko" | "en";
};

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";

function getOllamaConfig() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, ""),
    model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
  };
}

function safeText(value: unknown, max = 12000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function callOllamaChat(
  messages: OllamaMessage[],
  options?: { temperature?: number },
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig();
  const resp = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages,
      options: {
        temperature: options?.temperature ?? 0.4,
      },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Ollama error (${resp.status}): ${body.slice(0, 300)}`);
  }

  const data = (await resp.json()) as { message?: { content?: string } };
  const content = safeText(data?.message?.content, 8000);
  if (!content) {
    throw new Error("Ollama returned empty response.");
  }
  return content;
}

function cleanupTranslationText(value: string): string {
  return value
    .trim()
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/```$/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function looksLikeNonTranslation(value: string): boolean {
  return /ready to translate|what is the .*text|please provide|which text would you like/i.test(value);
}

async function generateSummary(payload: AiSummaryPayload) {
  const lang = payload.lang === "en" ? "en" : "ko";
  const content = safeText(payload.content, 14000);

  if (!content) {
    return {
      summary: lang === "ko" ? "요약할 본문이 없습니다." : "No content to summarize.",
    };
  }

  const system =
    lang === "ko"
      ? "너는 한국어 글쓰기 에디터의 요약 어시스턴트다. 간결하고 실용적으로 답한다."
      : "You are a concise writing-summary assistant.";
  const user =
    lang === "ko"
      ? `다음 글을 3~4문장으로 핵심 요약해줘. 과장 없이 사실 중심으로 써줘.\n\n${content}`
      : `Summarize the following draft in 3-4 concise sentences.\n\n${content}`;

  const summary = await callOllamaChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  return { summary };
}

async function generateAssistantReply(payload: AiAssistantPayload) {
  const lang = payload.lang === "en" ? "en" : "ko";
  const message = safeText(payload.message, 2000);
  const title = safeText(payload.title, 200);
  const content = safeText(payload.content, 10000);
  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];

  if (!message) {
    return {
      reply: lang === "ko" ? "질문을 입력해 주세요." : "Please enter your request.",
    };
  }

  const system =
    lang === "ko"
      ? "너는 한국어/영어 글쓰기 코치다. 지시형보다 제안형으로, 3~6문장 이내로 답한다."
      : "You are a bilingual writing coach. Be practical and concise in 3-6 sentences.";

  const historyLines = history
    .map((h) => `${h.role === "assistant" ? "assistant" : "user"}: ${safeText(h.text, 1000)}`)
    .join("\n");

  const context = [
    title ? `title: ${title}` : "",
    content ? `draft:\n${content}` : "",
    historyLines ? `history:\n${historyLines}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const user =
    lang === "ko"
      ? `아래 문맥을 참고해서 사용자의 요청에 답해줘.\n\n${context}\n\nuser request: ${message}`
      : `Answer the user's request based on this context.\n\n${context}\n\nuser request: ${message}`;

  const reply = await callOllamaChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  return { reply };
}

async function generateTranslation(payload: AiTranslatePayload) {
  const sourceLang = payload.sourceLang === "en" ? "en" : "ko";
  const targetLang = payload.targetLang === "ko" ? "ko" : "en";
  const text = safeText(payload.text, 15000);

  if (!text) {
    return {
      translatedText: targetLang === "ko" ? "번역할 텍스트가 없습니다." : "No text to translate.",
    };
  }
  if (sourceLang === targetLang) {
    return { translatedText: text };
  }

  const system =
    "You are a strict translation engine. Translate only. Keep meaning and line breaks. Return only translated text without explanations, questions, or preface.";
  const user = [
    `SOURCE_LANGUAGE: ${sourceLang}`,
    `TARGET_LANGUAGE: ${targetLang}`,
    "TASK: Translate SOURCE_TEXT faithfully.",
    "OUTPUT_RULES: Output translation only. Do not ask questions. Do not include quotes, labels, or notes.",
    "SOURCE_TEXT:",
    text,
  ].join("\n");

  let translatedText = cleanupTranslationText(
    await callOllamaChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.1 },
    ),
  );

  // Some models occasionally return meta text like "I'm ready to translate..."
  // Retry once with a harder constraint before surfacing an error.
  if (looksLikeNonTranslation(translatedText)) {
    translatedText = cleanupTranslationText(
      await callOllamaChat(
        [
          {
            role: "system",
            content:
              "Return ONLY translated text. Never ask for more input. Never explain. Never output anything except the translation.",
          },
          { role: "user", content: `Translate from ${sourceLang} to ${targetLang}:\n${text}` },
        ],
        { temperature: 0 },
      ),
    );
  }

  if (!translatedText || looksLikeNonTranslation(translatedText)) {
    throw new Error("Translation model returned invalid output. Please retry.");
  }

  return { translatedText };
}

export async function handleAiPath(pathname: string, payload: unknown) {
  if (pathname === "/api/ai/summary") {
    return generateSummary((payload ?? {}) as AiSummaryPayload);
  }
  if (pathname === "/api/ai/assistant") {
    return generateAssistantReply((payload ?? {}) as AiAssistantPayload);
  }
  if (pathname === "/api/ai/translate") {
    return generateTranslation((payload ?? {}) as AiTranslatePayload);
  }
  throw new Error(`Unknown AI path: ${pathname}`);
}

export function formatAiHttpError(error: unknown): { status: number; json: Record<string, unknown> } {
  const message = error instanceof Error ? error.message : "Unknown AI error";
  const isOllamaIssue = message.toLowerCase().includes("ollama");
  return {
    status: isOllamaIssue ? 503 : 400,
    json: isOllamaIssue
      ? {
          error: message,
          hint: "Set OLLAMA_BASE_URL (and OLLAMA_MODEL) on the server to an Ollama host reachable from this process, or run Ollama locally for dev.",
        }
      : { error: message },
  };
}

function sendError(res: Response, error: unknown) {
  const { status, json } = formatAiHttpError(error);
  res.status(status).json(json);
}

export function registerAiRoutes(app: Express) {
  app.post("/api/ai/summary", async (req: Request, res: Response) => {
    try {
      const data = await handleAiPath("/api/ai/summary", req.body);
      res.json(data);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/ai/assistant", async (req: Request, res: Response) => {
    try {
      const data = await handleAiPath("/api/ai/assistant", req.body);
      res.json(data);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/ai/translate", async (req: Request, res: Response) => {
    try {
      const data = await handleAiPath("/api/ai/translate", req.body);
      res.json(data);
    } catch (error) {
      sendError(res, error);
    }
  });
}
