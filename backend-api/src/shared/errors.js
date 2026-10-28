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
