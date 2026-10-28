// Carrega as variáveis de ambiente de env/.env (pasta na raiz do projeto)
// e entrega tudo já tratado num objeto só.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(raiz, "env", ".env") });

if (!process.env.JWT_SEGREDO || process.env.JWT_SEGREDO.length < 16) {
  throw new Error("Defina JWT_SEGREDO (mínimo 16 caracteres) em env/.env");
}

export const env = {
  producao: process.env.NODE_ENV === "production",
  porta: Number(process.env.PORT || 3333),
  corsOrigens: (process.env.CORS_ORIGENS || "http://localhost:5173").split(",").map((o) => o.trim()),
  banco: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "postgres",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    // Neon e similares exigem SSL ("require")
    ssl: ["require", "verify-full", "verify-ca"].includes(process.env.PGSSLMODE) ? { rejectUnauthorized: false } : false,
  },
  jwt: {
    segredo: process.env.JWT_SEGREDO,
    expiraEm: process.env.JWT_EXPIRA_EM || "15m",
    refreshDias: Number(process.env.REFRESH_EXPIRA_DIAS || 7),
  },
  seedSenha: process.env.SEED_SENHA || "Mudar@123",
};
