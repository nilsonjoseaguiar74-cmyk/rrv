import { Router } from "express";
import { query } from "../db.js";

export const healthRouter = Router();
healthRouter.get("/health", async (_request, response) => {
  try {
    await query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch {
    response.status(503).json({ status: "error", database: "unavailable" });
  }
});
