import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { handleAiPath, formatAiHttpError } from "../api/lib/aiBackend";
import { isAiAuthDisabled, verifySupabaseBearer } from "../api/lib/verifySupabaseAuth";

export { handleAiPath, formatAiHttpError } from "../api/lib/aiBackend";

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

function sendError(res: Response, error: unknown) {
  const { status, json } = formatAiHttpError(error);
  res.status(status).json(json);
}

async function assertAiRequest(req: Request, res: Response): Promise<boolean> {
  if (isAiAuthDisabled()) {
    return true;
  }
  const result = await verifySupabaseBearer(req.get("Authorization") ?? null);
  if (!("user" in result)) {
    res.status(result.status).json(result.body ?? { error: result.error });
    return false;
  }
  return true;
}

function registerOne(
  app: Express,
  path: "/api/ai/summary" | "/api/ai/assistant" | "/api/ai/translate",
) {
  app.post(
    path,
    aiLimiter,
    async (req: Request, res: Response) => {
      if (!(await assertAiRequest(req, res))) {
        return;
      }
      try {
        const data = await handleAiPath(path, req.body);
        res.json(data);
      } catch (error) {
        sendError(res, error);
      }
    },
  );
}

export function registerAiRoutes(app: Express) {
  registerOne(app, "/api/ai/summary");
  registerOne(app, "/api/ai/assistant");
  registerOne(app, "/api/ai/translate");
}
