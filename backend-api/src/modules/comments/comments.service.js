// Regras dos comentários nas contas.
import { ErroHttp, naoEncontrado } from "../../shared/errors.js";
import { comentariosRepositorio } from "./comments.repository.js";

export class ComentariosServico {
  constructor(repositorio = comentariosRepositorio) {
    this.repositorio = repositorio;
  }

  // Lista os comentários de uma conta
  listar(movimentacaoId) {
    return this.repositorio.listarPorMovimentacao(movimentacaoId);
  }

  // Cria um comentário; antes confere se a conta existe
  async criar(movimentacaoId, texto, usuario) {
    if (!(await this.repositorio.movimentacaoExiste(movimentacaoId))) throw naoEncontrado("Movimentação", true);
    return this.repositorio.criar(movimentacaoId, usuario.id, texto);
  }

  // Só o próprio autor apaga o seu comentário
  async apagar(id, usuario) {
    const autorId = await this.repositorio.buscarAutor(id);
    if (autorId === undefined) throw naoEncontrado("Comentário");
    if (autorId !== usuario.id) throw new ErroHttp(403, "Você só pode apagar os seus próprios comentários.");
    await this.repositorio.apagar(id);
  }
}

// Instância única usada pelas rotas
export const comentariosServico = new ComentariosServico();
