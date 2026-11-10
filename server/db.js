import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;
let pool;
let queryImplementation;

export function setQueryImplementation(implementation) {
  queryImplementation = implementation;
}

export function getPool() {
  if (!pool) {
    if (!config.databaseUrl) throw new Error("DATABASE_URL não configurada.");
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: config.poolMax,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

export async function query(text, values = []) {
  if (queryImplementation) return queryImplementation(text, values);
  return getPool().query(text, values);
}

export async function transaction(work) {
  if (queryImplementation) return work({ query: queryImplementation });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) await pool.end();
  pool = undefined;
  queryImplementation = undefined;
}
