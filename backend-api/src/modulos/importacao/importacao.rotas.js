// Rotas da importação de extratos OFX: primeiro a prévia (não grava nada), depois a importação de verdade.
// As regras ficam em importacao.servico.js; aqui só tratamos o upload e a resposta HTTP.
import { Router } from "express";
import multer from "multer";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { importacaoServico as servico } from "./importacao.servico.js";

// Arquivo fica na memória (máx. 5 MB), não é salvo em disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const router = Router();
router.use(autenticar, autorizar("importacao:criar"));

// Lê o arquivo e mostra o que seria importado, marcando as que já existem
router.post("/preview", upload.single("arquivo"), assincrono(async (req, res) => {
  res.json(await servico.previa(req.file));
}));

// Importação de verdade
router.post("/", upload.single("arquivo"), assincrono(async (req, res) => {
  res.status(201).json(await servico.importar(req.file, req.usuario));
}));

export default router;
