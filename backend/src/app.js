import cors from "cors";
import express from "express";
import helmet from "helmet";
import { categories, titles } from "./catalog.js";
import { checkDb, getLibrary, updateTitle } from "./db.js";

export const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", async (_req, res) => {
  try {
    res.json({ status: "ok", database: await checkDb(), timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

app.get("/api/titles", (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const genre = String(req.query.genre || "").toLowerCase();
  const results = titles.filter((item) =>
    (!search || `${item.title} ${item.description} ${item.genre}`.toLowerCase().includes(search)) &&
    (!genre || item.genre.toLowerCase() === genre)
  );
  res.json({ titles: results, categories });
});

app.get("/api/titles/:id", (req, res) => {
  const title = titles.find((item) => item.id === req.params.id);
  if (!title) return res.status(404).json({ error: "Title not found" });
  res.json(title);
});

app.get("/api/profiles/:profileId/library", async (req, res, next) => {
  try { res.json({ items: await getLibrary(req.params.profileId) }); } catch (error) { next(error); }
});

app.put("/api/profiles/:profileId/library/:titleId", async (req, res, next) => {
  try {
    if (!titles.some((item) => item.id === req.params.titleId)) return res.status(404).json({ error: "Title not found" });
    res.json(await updateTitle(req.params.profileId, req.params.titleId, req.body));
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});
