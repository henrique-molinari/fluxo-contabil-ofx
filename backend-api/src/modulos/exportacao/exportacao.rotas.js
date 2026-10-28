// Rotas da exportação (relatórios): só perfis com "relatorios:exportar". O estagiário não tira relatório.
// A geração do arquivo fica em exportacao.servico.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { exportacaoServico as servico } from "./exportacao.servico.js";

const schemas = {
  exportar: { params: z.object({ formato: z.enum(["csv", "xlsx", "txt", "ofx"], { errorMap: () => ({ message: "Formato inválido. Use csv, xlsx, txt ou ofx." }) }) }) },
};

const router = Router();
router.use(autenticar, autorizar("relatorios:exportar"));

// GET /api/exportacao/csv | xlsx | txt | ofx  -> baixa o arquivo com todas as contas
router.get("/:formato", validar(schemas.exportar), assincrono(async (req, res) => {
  const { buffer, tipo, nome } = await servico.exportar(req.params.formato);
  // attachment faz o navegador baixar o arquivo em vez de abrir
  res.set({
    "Content-Type": tipo,
    "Content-Disposition": `attachment; filename="${nome}"`,
    "Content-Length": buffer.length,
  });
  res.send(buffer);
}));

export default router;
