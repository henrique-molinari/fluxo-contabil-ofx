// Rotas da exportação (relatórios): só perfis com "relatorios:exportar". O estagiário não tira relatório.
// A geração do arquivo fica em export.service.js; aqui só tratamos HTTP.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../shared/asyncHandler.js";
import { autenticar } from "../../shared/middlewares/authenticate.js";
import { autorizar } from "../../shared/middlewares/authorize.js";
import { validar } from "../../shared/middlewares/validate.js";
import { exportacaoServico as servico } from "./export.service.js";

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
