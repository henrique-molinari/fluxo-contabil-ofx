// Repositório de movimentações: é a ÚNICA camada que escreve SQL sobre a tabela "movimentacoes".
// O serviço decide as regras; aqui só falamos com o banco.
import { consultar } from "../../shared/db.js";

// Colunas devolvidas ao cliente (sem campos internos de auditoria)
const COLUNAS = "id, data_movimentacao, valor, descricao, categoria";

export class MovimentacoesRepositorio {
  // Lista com filtros opcionais. O padrão ($1 IS NULL OR ...) ignora o filtro quando não foi enviado.
  async listar({ busca, categoria, de, ate }) {
    const { rows } = await consultar(
      `SELECT m.id, m.data_movimentacao, m.valor, m.descricao, m.categoria,
              (SELECT count(*)::int FROM comentarios c WHERE c.movimentacao_id = m.id) AS qtd_comentarios
         FROM movimentacoes m
        WHERE ($1::text IS NULL OR m.descricao ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR m.categoria = $2)
          AND ($3::date IS NULL OR m.data_movimentacao >= $3)
          AND ($4::date IS NULL OR m.data_movimentacao <= $4)
        ORDER BY m.data_movimentacao DESC, m.id DESC`,
      [busca || null, categoria ?? null, de ?? null, ate ?? null]
    );
    return rows;
  }

  // Insere uma movimentação e devolve a linha criada
  async criar({ data_movimentacao, valor, descricao, categoria }, usuarioId) {
    const { rows } = await consultar(
      `INSERT INTO movimentacoes (data_movimentacao, valor, descricao, categoria, criado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}`,
      [data_movimentacao, valor, descricao, categoria, usuarioId]
    );
    return rows[0];
  }

  // Atualização parcial: COALESCE mantém o valor atual dos campos que não foram enviados.
  // Também registra quem alterou e quando (auditoria). Devolve undefined se o id não existe.
  async atualizar(id, dados, usuarioId) {
    const { rows } = await consultar(
      `UPDATE movimentacoes SET
          data_movimentacao = COALESCE($2, data_movimentacao),
          valor             = COALESCE($3, valor),
          descricao         = COALESCE($4, descricao),
          categoria         = COALESCE($5, categoria),
          alterado_por = $6, alterado_em = now()
        WHERE id = $1 RETURNING ${COLUNAS}`,
      [id, dados.data_movimentacao ?? null, dados.valor ?? null, dados.descricao ?? null, dados.categoria ?? null, usuarioId]
    );
    return rows[0];
  }

  // Contas que ainda não foram classificadas (candidatas à classificação automática)
  async listarSemCategoria() {
    const { rows } = await consultar("SELECT id, descricao FROM movimentacoes WHERE categoria = 'Sem categoria'");
    return rows;
  }

  // Aplica várias categorias de uma vez com um único UPDATE (em vez de um por conta).
  // "itens" tem o formato [{ id, categoria }]. Devolve quantas linhas foram alteradas.
  async atualizarCategorias(itens, usuarioId) {
    if (itens.length === 0) return 0;
    const { rowCount } = await consultar(
      `UPDATE movimentacoes m
          SET categoria = v.categoria, alterado_por = $3, alterado_em = now()
         FROM unnest($1::int[], $2::text[]) AS v(id, categoria)
        WHERE m.id = v.id`,
      [itens.map((i) => i.id), itens.map((i) => i.categoria), usuarioId]
    );
    return rowCount;
  }

  // Apaga uma conta; devolve quantas linhas foram removidas (0 = não existia)
  async apagar(id) {
    const { rowCount } = await consultar("DELETE FROM movimentacoes WHERE id = $1", [id]);
    return rowCount;
  }

  // Apaga todas as contas (os comentários vão junto por causa do ON DELETE CASCADE)
  async apagarTodas() {
    const { rowCount } = await consultar("DELETE FROM movimentacoes");
    return rowCount;
  }
}

// Instância única usada pelo restante da aplicação
export const movimentacoesRepositorio = new MovimentacoesRepositorio();
