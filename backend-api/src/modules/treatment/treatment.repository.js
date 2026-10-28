// Repositório de movimentações: é a ÚNICA camada que fala com o banco sobre as contas,
// usando o model Movimentacao do Sequelize. O serviço decide as regras; aqui só buscamos e gravamos.
import { Op, literal } from "sequelize";
import { sequelize } from "../../shared/db.js";
import { Movimentacao } from "../../shared/models/index.js";

// Colunas devolvidas ao cliente (sem campos internos de auditoria)
const COLUNAS = ["id", "data_movimentacao", "valor", "descricao", "categoria"];

// Converte uma instância do model em objeto simples, só com as colunas públicas
const paraObjeto = (instancia) => Object.fromEntries(COLUNAS.map((c) => [c, instancia.get(c)]));

export class MovimentacoesRepositorio {
  // Lista com filtros opcionais: só entram na consulta os filtros que foram enviados
  async listar({ busca, categoria, de, ate }) {
    const filtros = [];
    if (busca) filtros.push({ descricao: { [Op.iLike]: `%${busca}%` } });
    if (categoria) filtros.push({ categoria });
    if (de) filtros.push({ data_movimentacao: { [Op.gte]: de } });
    if (ate) filtros.push({ data_movimentacao: { [Op.lte]: ate } });

    return Movimentacao.findAll({
      // qtd_comentarios: subconsulta que conta os comentários de cada conta
      attributes: [
        ...COLUNAS,
        [literal('(SELECT count(*)::int FROM comentarios c WHERE c.movimentacao_id = "Movimentacao"."id")'), "qtd_comentarios"],
      ],
      where: { [Op.and]: filtros },
      order: [["data_movimentacao", "DESC"], ["id", "DESC"]],
      raw: true,
    });
  }

  // Insere uma movimentação e devolve a linha criada
  async criar(dados, usuarioId) {
    const criada = await Movimentacao.create({ ...dados, criado_por: usuarioId });
    return paraObjeto(criada);
  }

  // Atualização parcial: só muda os campos enviados e registra quem alterou e quando (auditoria).
  // Devolve undefined se o id não existe.
  async atualizar(id, dados, usuarioId) {
    const conta = await Movimentacao.findByPk(id);
    if (!conta) return undefined;

    const alteracoes = {};
    for (const campo of ["data_movimentacao", "valor", "descricao", "categoria"]) {
      if (dados[campo] !== undefined && dados[campo] !== null) alteracoes[campo] = dados[campo];
    }
    await conta.update({ ...alteracoes, alterado_por: usuarioId, alterado_em: new Date() });
    return paraObjeto(conta);
  }

  // Contas que ainda não foram classificadas (candidatas à classificação automática)
  async listarSemCategoria() {
    return Movimentacao.findAll({
      attributes: ["id", "descricao"],
      where: { categoria: "Sem categoria" },
      raw: true,
    });
  }

  // Aplica várias categorias de uma vez. "itens" tem o formato [{ id, categoria }].
  // Agrupa as contas por categoria e faz um UPDATE por categoria, tudo numa transação.
  // Devolve quantas linhas foram alteradas.
  async atualizarCategorias(itens, usuarioId) {
    if (itens.length === 0) return 0;

    const idsPorCategoria = new Map();
    for (const { id, categoria } of itens) {
      idsPorCategoria.set(categoria, [...(idsPorCategoria.get(categoria) ?? []), id]);
    }

    return sequelize.transaction(async (transaction) => {
      let alteradas = 0;
      for (const [categoria, ids] of idsPorCategoria) {
        const [quantidade] = await Movimentacao.update(
          { categoria, alterado_por: usuarioId, alterado_em: new Date() },
          { where: { id: ids }, transaction }
        );
        alteradas += quantidade;
      }
      return alteradas;
    });
  }

  // Apaga uma conta; devolve quantas linhas foram removidas (0 = não existia)
  async apagar(id) {
    return Movimentacao.destroy({ where: { id } });
  }

  // Apaga todas as contas (os comentários vão junto por causa do ON DELETE CASCADE do banco)
  async apagarTodas() {
    return Movimentacao.destroy({ where: {} });
  }
}

// Instância única usada pelo restante da aplicação
export const movimentacoesRepositorio = new MovimentacoesRepositorio();
