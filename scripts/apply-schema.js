import fs from "node:fs/promises";
import { query, closePool } from "../server/db.js";

try {
  const schema = await fs.readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  const seed = await fs.readFile(new URL("../sql/seed.sql", import.meta.url), "utf8");
  await query(schema);
  await query(seed);
  console.log("Schema e conteúdo inicial aplicados.");
} finally { await closePool(); }
