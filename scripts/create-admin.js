import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hashPassword } from "../server/auth/password.js";
import { query, closePool } from "../server/db.js";

const terminal = readline.createInterface({ input: stdin, output: stdout });
try {
  const name = (await terminal.question("Nome do administrador: ")).trim();
  const email = (await terminal.question("E-mail: ")).trim().toLowerCase();
  const password = await terminal.question("Senha (mínimo 12 caracteres): ");
  const confirmation = await terminal.question("Confirme a senha: ");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Nome ou e-mail inválido.");
  if (password !== confirmation) throw new Error("As senhas não coincidem.");
  const passwordHash = await hashPassword(password);
  await query(`INSERT INTO admin_users (name,email,password_hash,role,is_active) VALUES ($1,$2,$3,'owner',true)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name,password_hash=excluded.password_hash,role='owner',is_active=true,updated_at=now()`, [name,email,passwordHash]);
  console.log("Administrador owner criado com segurança.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Não foi possível criar o administrador.");
  process.exitCode = 1;
} finally {
  terminal.close();
  await closePool();
}
