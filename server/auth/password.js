import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12) throw new Error("A senha deve ter ao menos 12 caracteres.");
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${Buffer.from(derived).toString("base64")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, saltValue, hashValue] = String(encoded).split("$");
    if (algorithm !== "scrypt") return false;
    const salt = Buffer.from(saltValue, "base64");
    const expected = Buffer.from(hashValue, "base64");
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) }));
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
