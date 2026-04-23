import { handleAiPath, formatAiHttpError } from "./ai";

type VercelLikeReq = { method?: string; body?: unknown };
type VercelLikeRes = {
  status: (code: number) => VercelLikeRes;
  json: (body: unknown) => void;
};

/**
 * Factory for Vercel Node serverless handlers (api/ai/*.ts).
 * Same logic as Express `registerAiRoutes` / Vite dev middleware.
 */
export function createVercelAiHandler(path: "/api/ai/summary" | "/api/ai/assistant" | "/api/ai/translate") {
  return async (req: VercelLikeReq, res: VercelLikeRes): Promise<void> => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const data = await handleAiPath(path, req.body ?? {});
      res.status(200).json(data);
    } catch (error) {
      const { status, json } = formatAiHttpError(error);
      res.status(status).json(json);
    }
  };
}
