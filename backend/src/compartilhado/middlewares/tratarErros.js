// Último middleware: transforma qualquer erro em JSON { erro, detalhes? }.
import { ErroHttp } from "../erros.js";

// Chamado quando nenhuma rota respondeu: gera o 404
export function rotaNaoEncontrada(req, res, next) {
  next(new ErroHttp(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }
  // Erros conhecidos de bibliotecas: JSON quebrado, upload grande demais...
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  }
  if (err.name === "MulterError") {
    const grande = err.code === "LIMIT_FILE_SIZE";
    return res
      .status(grande ? 413 : 400)
      .json({ erro: grande ? "Arquivo maior que o limite de 5 MB." : "Erro no envio do arquivo." });
  }
  // Códigos do PostgreSQL: 23505 = valor único repetido, 23503 = chave estrangeira inválida
  if (err.code === "23505") return res.status(409).json({ erro: "Registro duplicado." });
  if (err.code === "23503") return res.status(409).json({ erro: "Referência inválida." });

  // Qualquer outro erro é bug nosso: loga no servidor, mas não vaza detalhes para o cliente
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
}
