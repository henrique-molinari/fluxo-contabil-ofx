// Exportação (relatórios): só perfis com "relatorios:exportar". O estagiário não tira relatório.
import { Router } from "express";
import { z } from "zod";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { FORMATOS } from "./formatos.js";

const schemas = {
  exportar: { params: z.object({ formato: z.enum(["csv", "xlsx", "txt", "ofx"], { errorMap: () => ({ message: "Formato inválido. Use csv, xlsx, txt ou ofx." }) }) }) },
};

const router = Router();
router.use(autenticar, autorizar("relatorios:exportar"));

// GET /api/exportacao/csv | xlsx | txt | ofx  -> baixa o arquivo com todas as contas
router.get("/:formato", validar(schemas.exportar), assincrono(async (req, res) => {
  const { formato } = req.params;
  const { rows } = await consultar(
    "SELECT id, data_movimentacao, valor, descricao, categoria FROM movimentacoes ORDER BY data_movimentacao DESC, id DESC"
  );
  // Um OFX sem nenhuma transação não serve para nada
  if (formato === "ofx" && rows.length === 0) throw new ErroHttp(400, "Não há movimentações para exportar.");

  const { buffer, tipo } = await FORMATOS[formato](rows);
  // attachment faz o navegador baixar o arquivo em vez de abrir
  res.set({
    "Content-Type": tipo,
    "Content-Disposition": `attachment; filename="movimentacoes.${formato}"`,
    "Content-Length": buffer.length,
  });
  res.send(buffer);
}));

export default router;
