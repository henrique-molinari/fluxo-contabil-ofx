// Aplica os arquivos de bd/migracoes/*.sql que ainda não rodaram, em ordem.
//   npm run db:migrar
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/compartilhado/db.js";

const pasta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../bd/migracoes");

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS migracoes_aplicadas (
    arquivo VARCHAR(200) PRIMARY KEY, aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const { rows } = await pool.query("SELECT arquivo FROM migracoes_aplicadas");
  // Quais arquivos já foram aplicados antes (assim o comando pode rodar quantas vezes quiser)
  const feitas = new Set(rows.map((r) => r.arquivo));

  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith(".sql")).sort();
  for (const arquivo of arquivos) {
    if (feitas.has(arquivo)) continue;
    // Cada migração roda numa transação: se der erro, volta tudo atrás
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query(fs.readFileSync(path.join(pasta, arquivo), "utf8"));
      await cliente.query("INSERT INTO migracoes_aplicadas (arquivo) VALUES ($1)", [arquivo]);
      await cliente.query("COMMIT");
      console.log(`✔ ${arquivo}`);
    } catch (e) {
      await cliente.query("ROLLBACK");
      throw new Error(`Falha em ${arquivo}: ${e.message}`);
    } finally {
      cliente.release();
    }
  }
  console.log("Banco atualizado.");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1; 
} finally {
  await pool.end();
}
