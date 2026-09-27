import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import { router } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CreateAppOptions {
  /** When true, serve the Vite production build from client/dist (Render / single-host). */
  serveClient?: boolean;
  clientDistPath?: string;
}

function resolveClientDist(explicit?: string): string | undefined {
  const candidates = [
    explicit,
    process.env.CLIENT_DIST_PATH,
    path.resolve(__dirname, "../../../client/dist"),
    path.resolve(process.cwd(), "client/dist")
  ].filter((p): p is string => Boolean(p));

  return candidates.find((p) => fs.existsSync(path.join(p, "index.html")));
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const serveClient = options.serveClient ?? process.env.SERVE_CLIENT === "1";
  const clientDist = serveClient ? resolveClientDist(options.clientDistPath) : undefined;

  app.use(cors());
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  if (!clientDist) {
    app.get("/", (_req, res) => {
      res.type("html").send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>SmartShambaAI API</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.5}
code{background:#f0f0f0;padding:0.1em 0.35em;border-radius:4px}</style></head>
<body>
  <h1>SmartShambaAI API</h1>
  <p>This is the backend. Open the web app at <a href="http://localhost:5173">http://localhost:5173</a>.</p>
  <p>Health check: <a href="/health"><code>/health</code></a> · Status: <a href="/api/status"><code>/api/status</code></a></p>
</body>
</html>`);
    });
  }

  app.use("/api", router);

  if (clientDist) {
    app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path === "/health") return next();
      res.sendFile(path.join(clientDist, "index.html"), (err) => (err ? next(err) : undefined));
    });
  }

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  return app;
}
