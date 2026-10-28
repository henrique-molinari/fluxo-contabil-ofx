// Rotas do tratamento das contas: listar, lançar manualmente, alterar, classificar e apagar.
// Aqui só tratamos HTTP (validação, permissão, resposta); as regras ficam em tratamento.servico.js.
import { Router } from "express";
import { z } from "zod";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { validar } from "../../compartilhado/middlewares/validar.js";
import { dataISO, idParam } from "../../compartilhado/schemas.js";
import { CATEGORIAS } from "./classificador.js";
import { tratamentoServico as servico } from "./tratamento.servico.js";

// ----- validações (zod) -----
const categoria = z.enum(CATEGORIAS, { errorMap: () => ({ message: "Categoria inválida." }) });
const valor = z.number().refine((v) => v !== 0 && Math.abs(v) < 1e13, "Valor inválido.");
const descricao = z.string().trim().min(1, "Informe a descrição.").max(255);

const schemas = {
  listar: {
    query: z.object({
      busca: z.string().trim().optional(),
      categoria: categoria.optional(),
      de: dataISO.optional(),
      ate: dataISO.optional(),
    }),
  },
  criar: {
    body: z.object({ data_movimentacao: dataISO, valor, descricao, categoria: categoria.optional() }),
  },
  atualizar: {
    params: idParam,
    body: z
      .object({ data_movimentacao: dataISO, valor, descricao, categoria })
      .partial()
      .refine((b) => Object.keys(b).length > 0, "Envie pelo menos um campo."),
  },
};

const router = Router();
// Todas as rotas daqui exigem login; cada uma pede sua permissão
router.use(autenticar);

// Lista de categorias para preencher os seletores da tela
router.get("/categorias", autorizar("movimentacoes:ler"), (req, res) => res.json(servico.categorias()));

// Lista com filtros opcionais (busca, categoria, período)
router.get("/movimentacoes", autorizar("movimentacoes:ler"), validar(schemas.listar), assincrono(async (req, res) => {
  res.json(await servico.listar(req.query));
}));

// Lançamento manual de uma conta
router.post("/movimentacoes", autorizar("movimentacoes:criar"), validar(schemas.criar), assincrono(async (req, res) => {
  res.status(201).json(await servico.criar(req.body, req.usuario));
}));

// Atualização parcial de uma conta
router.patch("/movimentacoes/:id", autorizar("movimentacoes:editar"), validar(schemas.atualizar), assincrono(async (req, res) => {
  res.json(await servico.atualizar(req.params.id, req.body, req.usuario));
}));

// Aplica as regras automáticas em tudo que ainda está "Sem categoria"
router.post("/movimentacoes/classificar-automatico", autorizar("movimentacoes:editar"), assincrono(async (req, res) => {
  res.json(await servico.classificarAutomatico(req.usuario));
}));

// Apaga uma conta
router.delete("/movimentacoes/:id", autorizar("movimentacoes:apagar"), validar({ params: idParam }), assincrono(async (req, res) => {
  await servico.apagar(req.params.id);
  res.status(204).end();
}));

// Apaga todas as contas
router.delete("/movimentacoes", autorizar("movimentacoes:apagar"), assincrono(async (req, res) => {
  res.json(await servico.apagarTodas());
}));

export default router;
