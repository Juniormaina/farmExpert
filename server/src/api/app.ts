import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express, type ErrorRequestHandler, type RequestHandler } from "express";
import cors from "cors";
import { router } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CreateAppOptions {
  /** When true, serve the Vite production build from client/dist (Render / single-host). */
  serveClient?: boolean;
  clientDistPath?: string;
}

/** Candidate locations for the Vite build output (works from source, dist, and Render cwd). */
export function resolveClientDist(explicit?: string): string | undefined {
  const candidates = [
    explicit,
    process.env.CLIENT_DIST_PATH,
    // From server/dist/api → repoRoot/client/dist
    path.resolve(__dirname, "../../../client/dist"),
    // From server/src/api (tsx) → repoRoot/client/dist
    path.resolve(__dirname, "../../../../client/dist"),
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "../client/dist"),
    path.resolve(process.cwd(), "dist")
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return path.resolve(candidate);
    }
  }
  return undefined;
}

function shouldServeClient(options: CreateAppOptions, clientDist: string | undefined): boolean {
  if (options.serveClient !== undefined) return options.serveClient;
  if (process.env.SERVE_CLIENT === "0") return false;
  if (process.env.SERVE_CLIENT === "1") return true;
  // Production on Render/Vercel-style hosts: serve the UI whenever the build exists.
  return process.env.NODE_ENV === "production" && Boolean(clientDist);
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const resolvedDist = resolveClientDist(options.clientDistPath);
  const serveClient = shouldServeClient(options, resolvedDist);
  const clientDist = serveClient ? resolvedDist : undefined;

  if (serveClient && !clientDist) {
    // eslint-disable-next-line no-console
    console.error(
      "[smartshambaai] SERVE_CLIENT/production is on but client/dist was not found. " +
        "Run `npm run build` (or set CLIENT_DIST_PATH). Falling back to the API status page."
    );
  } else if (clientDist) {
    // eslint-disable-next-line no-console
    console.log(`[smartshambaai] Serving frontend (PWA) from ${clientDist}`);
  }

  app.use(cors());
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", router);

  if (clientDist) {
    // Never cache the service worker or HTML shell; cache hashed assets.
    const staticHandler = express.static(clientDist, {
      index: false,
      setHeaders(res, filePath) {
        const base = path.basename(filePath);
        if (base === "sw.js" || base === "registerSW.js" || base === "index.html" || base.endsWith(".webmanifest")) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    });
    app.use(staticHandler);

    const spaFallback: RequestHandler = (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path.startsWith("/api") || req.path === "/health") return next();
      // Let missing static files (icons, sw, etc.) 404 instead of returning HTML.
      if (path.extname(req.path)) return next();
      res.sendFile(path.join(clientDist, "index.html"), (err) => (err ? next(err) : undefined));
    };
    app.get("*", spaFallback);
  } else {
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

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  return app;
}
