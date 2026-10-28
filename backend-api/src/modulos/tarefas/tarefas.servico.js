// Regras das tarefas delegadas. O gestor cria e atribui (ex.: "Preciso do balanço de setembro");
// cada pessoa vê as suas e atualiza o andamento. Só o gestor enxerga todas.
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { PERFIS } from "../../config/permissoes.js";
import { tarefasRepositorio } from "./tarefas.repositorio.js";

// Ciclo de vida de uma tarefa (as rotas usam a mesma lista na validação)
export const STATUS = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];

// Atalho: o usuário é gestor?
const ehGestor = (usuario) => usuario.perfil === PERFIS.GESTOR;

export class TarefasServico {
  constructor(repositorio = tarefasRepositorio) {
    this.repositorio = repositorio;
  }

  // Quem não é gestor só enxerga as tarefas atribuídas a si mesmo
  listar({ status, atribuido_a }, usuario) {
    const dono = ehGestor(usuario) ? atribuido_a ?? null : usuario.id;
    return this.repositorio.listar({ dono, status });
  }

  // Só o gestor cria (a rota já barra os outros). A tarefa precisa ir para um usuário ativo.
  async criar(dados, usuario) {
    if (!(await this.repositorio.usuarioAtivo(dados.atribuido_a))) {
      throw new ErroHttp(400, "Usuário de destino não existe ou está desativado.");
    }
    const id = await this.repositorio.criar(dados, usuario.id);
    return this.repositorio.buscarPorId(id);
  }

  // Só o dono da tarefa ou o gestor muda o andamento
  async mudarStatus(id, status, usuario) {
    const tarefa = await this.repositorio.buscarPorId(id);
    if (!tarefa) throw naoEncontrado("Tarefa", true);
    if (!ehGestor(usuario) && tarefa.atribuido_a !== usuario.id) {
      throw new ErroHttp(403, "Esta tarefa não está atribuída a você.");
    }
    await this.repositorio.atualizarStatus(id, status);
    return this.repositorio.buscarPorId(id);
  }

  // Exclui a tarefa; 404 se ela não existir
  async excluir(id) {
    if (!(await this.repositorio.excluir(id))) throw naoEncontrado("Tarefa", true);
  }
}

// Instância única usada pelas rotas
export const tarefasServico = new TarefasServico();
