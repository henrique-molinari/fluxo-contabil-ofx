// Erro com código HTTP. Qualquer módulo pode dar "throw new ErroHttp(404, '...')"
// e o tratador de erros (middlewares/tratarErros.js) transforma em resposta JSON.
export class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Atalho para o 404 mais comum: naoEncontrado('Tarefa') -> "Tarefa não encontrado."
export const naoEncontrado = (o = "Registro") => new ErroHttp(404, `${o} não encontrado.`);
