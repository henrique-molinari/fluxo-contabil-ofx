// Monta o Express: segurança, rotas de cada módulo e tratamento de erros.
// Separado do server.js para os testes conseguirem subir o app sem abrir porta fixa.
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { rotaNaoEncontrada, tratarErros } from "./shared/middlewares/errorHandler.js";

import authRotas from "./modules/auth/auth.routes.js";
import usuariosRotas from "./modules/users/users.routes.js";
import tratamentoRotas from "./modules/treatment/treatment.routes.js";
import comentariosRotas from "./modules/comments/comments.routes.js";
import importacaoRotas from "./modules/import/import.routes.js";
import analiseRotas from "./modules/analysis/analysis.routes.js";
import exportacaoRotas from "./modules/export/export.routes.js";
import tarefasRotas from "./modules/tasks/tasks.routes.js";

export function criarApp() {
  const app = express();

  // Cabeçalhos de segurança padrão (X-Frame-Options, HSTS etc.)
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigens, exposedHeaders: ["Content-Disposition"] }));
  // Limita o corpo JSON para ninguém derrubar a API com payload gigante
  app.use(express.json({ limit: "100kb" }));

  // Rota pública usada para checar se a API está no ar
  app.get("/api/saude", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRotas);
  app.use("/api/usuarios", usuariosRotas);
  app.use("/api/importacao", importacaoRotas);
  app.use("/api/analise", analiseRotas);
  app.use("/api/exportacao", exportacaoRotas);
  app.use("/api/tarefas", tarefasRotas);
  // movimentações e comentários compartilham o prefixo /api (ex.: /movimentacoes/:id/comentarios)
  app.use("/api", tratamentoRotas);
  app.use("/api", comentariosRotas);

  // Sempre por último: 404 para rotas desconhecidas e tratador central de erros
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
