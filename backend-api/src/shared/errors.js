// Erro com código HTTP. Qualquer módulo pode dar "throw new ErroHttp(404, '...')"
// e o tratador de erros (middlewares/errorHandler.js) transforma em resposta JSON.
export class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Atalho para o 404 mais comum, já com a concordância certa:
//   naoEncontrado("Usuário")          -> "Usuário não encontrado."
//   naoEncontrado("Tarefa", true)     -> "Tarefa não encontrada."
export const naoEncontrado = (o = "Registro", feminino = false) =>
  new ErroHttp(404, `${o} não encontrad${feminino ? "a" : "o"}.`);

// Erro de "valor único repetido": o Sequelize lança UniqueConstraintError e o PostgreSQL usa o código 23505
export const violacaoUnica = (e) => e.name === "SequelizeUniqueConstraintError" || e.code === "23505";

// Erro de chave estrangeira inválida: ForeignKeyConstraintError no Sequelize, código 23503 no PostgreSQL
export const violacaoReferencia = (e) => e.name === "SequelizeForeignKeyConstraintError" || e.code === "23503";
