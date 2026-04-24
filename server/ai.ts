import type { Express, Request, Response } from "express";
import { handleAiPath, formatAiHttpError } from "../shared/aiBackend";

export { handleAiPath, formatAiHttpError } from "../shared/aiBackend";

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
