// Monta o Express: segurança, rotas de cada módulo e tratamento de erros.
// Separado do server.js para os testes conseguirem subir o app sem abrir porta fixa.
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { rotaNaoEncontrada, tratarErros } from "./compartilhado/middlewares/tratarErros.js";

import authRotas from "./modulos/auth/auth.rotas.js";
import usuariosRotas from "./modulos/usuarios/usuarios.rotas.js";
import tratamentoRotas from "./modulos/tratamento/tratamento.rotas.js";
import comentariosRotas from "./modulos/comentarios/comentarios.rotas.js";
import importacaoRotas from "./modulos/importacao/importacao.rotas.js";
import analiseRotas from "./modulos/analise/analise.rotas.js";
import exportacaoRotas from "./modulos/exportacao/exportacao.rotas.js";
import tarefasRotas from "./modulos/tarefas/tarefas.rotas.js";

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
