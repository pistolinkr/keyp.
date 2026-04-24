import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registerAiRoutes } from "./ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** CORS allows only origins (scheme+host+port), not paths. Comma-separated list is OK; paths are stripped. */
function parseAiCorsOrigins(raw: string): string[] {
  const out = new Set<string>();
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    if (t === "*") {
      out.add("*");
      continue;
    }
    try {
      const u = new URL(t.includes("://") ? t : `https://${t}`);
      out.add(u.origin);
    } catch {
      /* skip invalid */
    }
  }
  return Array.from(out);
}

function aiCors(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const raw = process.env.AI_CORS_ORIGIN?.trim();
  if (!raw) {
    next();
    return;
  }
  const allowed = parseAiCorsOrigins(raw);
  if (allowed.length === 0) {
    next();
    return;
  }

  const origin = req.get("Origin");
  let reflect: string | undefined;
  if (allowed.includes("*")) {
    reflect = "*";
  } else if (origin && allowed.includes(origin)) {
    reflect = origin;
  } else if (!origin && allowed.length === 1) {
    reflect = allowed[0];
  }

  if (reflect) {
    res.setHeader("Access-Control-Allow-Origin", reflect);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
  }
  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "2mb" }));

  // Cross-origin browser → Docker/VPS API (e.g. SPA on Vercel). Set AI_CORS_ORIGIN to that SPA origin.
  app.use("/api/ai", aiCors);

  // AI runs on this process; OLLAMA_* must point to Ollama reachable from here (not the browser).
  registerAiRoutes(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
