// Ponto de entrada:  npm run dev  (ou npm start)
import { env } from "./config/env.js";
import { criarApp } from "./app.js";
import { sequelize } from "./shared/db.js";

// Sobe o servidor HTTP na porta configurada em env/.env
const servidor = criarApp().listen(env.porta, () => {
  console.log(`API rodando em http://localhost:${env.porta}/api`);
});

// Fecha tudo direito quando o processo é encerrado
for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => servidor.close(() => sequelize.close().then(() => process.exit(0))));
}
