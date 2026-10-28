// Importação de extratos OFX: primeiro a prévia (não grava nada), depois a importação de verdade.
import { Router } from "express";
import multer from "multer";
import { consultar, transacao } from "../../compartilhado/db.js";
import { ErroHttp } from "../../compartilhado/erros.js";
import { assincrono } from "../../compartilhado/asyncHandler.js";
import { autenticar } from "../../compartilhado/middlewares/autenticar.js";
import { autorizar } from "../../compartilhado/middlewares/autorizar.js";
import { lerOfx } from "./ofx.parser.js";

// Arquivo fica na memória (máx. 5 MB), não é salvo em disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Confere que veio um arquivo e já converte o OFX em lista de movimentações
function arquivoOfx(req) {
  if (!req.file) throw new ErroHttp(400, "Nenhum arquivo enviado. Use o campo 'arquivo'.");
  return lerOfx(req.file.buffer);
}

// Identifica uma movimentação igual a outra (mesma regra do índice único do banco)
const chave = (m) => `${m.data}|${Number(m.valor).toFixed(2)}|${m.descricao}`;

const router = Router();
router.use(autenticar, autorizar("importacao:criar"));

// Lê o arquivo e mostra o que seria importado, marcando as que já existem
router.post("/preview", upload.single("arquivo"), assincrono(async (req, res) => {
  const movimentos = arquivoOfx(req);

  // Descobre quais já existem no banco para avisar que são duplicadas
  const { rows } = await consultar(
    `SELECT data_movimentacao::text AS data, valor, descricao FROM movimentacoes
      WHERE (data_movimentacao, valor, descricao) IN
            (SELECT * FROM unnest($1::date[], $2::numeric[], $3::text[]))`,
    [movimentos.map((m) => m.data), movimentos.map((m) => m.valor), movimentos.map((m) => m.descricao)]
  );
  const existentes = new Set(rows.map((r) => chave({ data: r.data, valor: r.valor, descricao: r.descricao })));

  res.json(movimentos.map((m) => ({ ...m, duplicada: existentes.has(chave(m)) })));
}));

// Importação de verdade. Tudo numa transação: se algo falhar, nada é gravado.
// ON CONFLICT DO NOTHING pula as duplicadas em vez de dar erro.
router.post("/", upload.single("arquivo"), assincrono(async (req, res) => {
  const movimentos = arquivoOfx(req);

  const resultado = await transacao(async (db) => {
    let inseridas = 0;
    for (const m of movimentos) {
      const { rowCount } = await db.query(
        `INSERT INTO movimentacoes (data_movimentacao, valor, descricao, categoria, criado_por)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [m.data, m.valor, m.descricao, m.categoria, req.usuario.id]
      );
      inseridas += rowCount;
    }
    return { inseridas, duplicadas: movimentos.length - inseridas };
  });
  res.status(201).json(resultado);
}));

export default router;
