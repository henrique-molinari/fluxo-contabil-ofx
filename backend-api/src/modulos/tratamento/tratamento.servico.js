// Regras de negócio do tratamento das contas (movimentações).
// Não conhece Express nem escreve SQL: recebe dados prontos e usa o repositório.
import { ErroHttp, naoEncontrado } from "../../compartilhado/erros.js";
import { CATEGORIAS, classificar } from "./classificador.js";
import { movimentacoesRepositorio } from "./tratamento.repositorio.js";

// Converte o erro de "valor único repetido" do PostgreSQL (23505) em um 409 amigável
function traduzirDuplicada(e) {
  if (e.code === "23505") {
    throw new ErroHttp(409, "Já existe uma movimentação igual (data, valor e descrição).");
  }
  throw e;
}

export class TratamentoServico {
  // O repositório entra pelo construtor (injeção de dependência): nos testes dá para trocar por um falso
  constructor(repositorio = movimentacoesRepositorio) {
    this.repositorio = repositorio;
  }

  // Lista de categorias para preencher os seletores da tela
  categorias() {
    return CATEGORIAS;
  }

  // Lista as contas aplicando os filtros opcionais
  listar(filtros) {
    return this.repositorio.listar(filtros);
  }

  // Lançamento manual: se não vier categoria, o classificador escolhe pela descrição
  async criar(dados, usuario) {
    const categoria = dados.categoria ?? classificar(dados.descricao);
    return this.repositorio.criar({ ...dados, categoria }, usuario.id).catch(traduzirDuplicada);
  }

  // Atualiza campos da conta; 404 se ela não existir
  async atualizar(id, dados, usuario) {
    const atualizada = await this.repositorio.atualizar(id, dados, usuario.id).catch(traduzirDuplicada);
    if (!atualizada) throw naoEncontrado("Movimentação", true);
    return atualizada;
  }

  // Aplica as regras automáticas em tudo que ainda está "Sem categoria".
  // Só grava as contas que de fato ganharam categoria, tudo num único UPDATE.
  async classificarAutomatico(usuario) {
    const pendentes = await this.repositorio.listarSemCategoria();
    const novas = pendentes
      .map(({ id, descricao }) => ({ id, categoria: classificar(descricao) }))
      .filter((item) => item.categoria !== "Sem categoria");
    const atualizadas = await this.repositorio.atualizarCategorias(novas, usuario.id);
    return { atualizadas };
  }

  // Apaga uma conta; 404 se ela não existir
  async apagar(id) {
    const removidas = await this.repositorio.apagar(id);
    if (!removidas) throw naoEncontrado("Movimentação", true);
  }

  // Apaga todas as contas e diz quantas eram
  async apagarTodas() {
    return { apagadas: await this.repositorio.apagarTodas() };
  }
}

// Instância única usada pelas rotas
export const tratamentoServico = new TratamentoServico();
