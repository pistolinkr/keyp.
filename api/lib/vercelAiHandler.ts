import type { IncomingMessage } from "node:http";
import { handleAiPath, formatAiHttpError } from "../../shared/aiBackend";

type VercelReq = IncomingMessage & { method?: string; body?: unknown };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

/** Vercel may or may not pre-parse JSON into req.body; support both. */
async function readJsonBody(req: VercelReq): Promise<unknown> {
  const pre = req.body;
  if (pre != null && typeof pre === "object" && !Buffer.isBuffer(pre)) {
    return pre;
  }
  if (typeof pre === "string" && pre.length > 0) {
    try {
      return JSON.parse(pre);
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: string | Buffer) => {
      chunks.push(typeof c === "string" ? Buffer.from(c) : c);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function createVercelAiHandler(path: "/api/ai/summary" | "/api/ai/assistant" | "/api/ai/translate") {
  return async (req: VercelReq, res: VercelRes): Promise<void> => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const data = await handleAiPath(path, payload);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: "Invalid JSON body" });
        return;
      }
      const { status, json } = formatAiHttpError(error);
      res.status(status).json(json);
    }
  };
}
