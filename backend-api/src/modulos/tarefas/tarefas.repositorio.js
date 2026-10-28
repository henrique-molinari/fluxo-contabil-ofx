// Repositório de tarefas: SQL da tabela "tarefas".
import { consultar } from "../../compartilhado/db.js";

// Consulta base: traz também o nome de quem criou e de quem recebeu a tarefa
const SELECT = `SELECT t.id, t.titulo, t.descricao, t.tipo, t.status, t.prazo, t.criado_em, t.concluido_em,
                       t.criado_por, c.nome AS criado_por_nome, t.atribuido_a, a.nome AS atribuido_a_nome
                  FROM tarefas t
                  JOIN usuarios c ON c.id = t.criado_por
                  JOIN usuarios a ON a.id = t.atribuido_a`;

export class TarefasRepositorio {
  // Lista: pendentes primeiro, depois por prazo mais próximo. Filtros nulos são ignorados.
  async listar({ dono, status }) {
    const { rows } = await consultar(
      `${SELECT}
        WHERE ($1::int IS NULL OR t.atribuido_a = $1) AND ($2::text IS NULL OR t.status = $2)
        ORDER BY (t.status = 'CONCLUIDA'), t.prazo NULLS LAST, t.criado_em DESC`,
      [dono ?? null, status ?? null]
    );
    return rows;
  }

  // Busca uma tarefa completa pelo id
  async buscarPorId(id) {
    const { rows } = await consultar(`${SELECT} WHERE t.id = $1`, [id]);
    return rows[0];
  }

  // Diz se o usuário existe e está ativo (só se atribui tarefa a quem pode trabalhar)
  async usuarioAtivo(id) {
    const { rows } = await consultar("SELECT ativo FROM usuarios WHERE id = $1", [id]);
    return Boolean(rows[0]?.ativo);
  }

  // Grava a tarefa e devolve o id criado
  async criar({ titulo, descricao, tipo, atribuido_a, prazo }, criadoPor) {
    const { rows } = await consultar(
      `INSERT INTO tarefas (titulo, descricao, tipo, atribuido_a, prazo, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [titulo, descricao ?? null, tipo, atribuido_a, prazo ?? null, criadoPor]
    );
    return rows[0].id;
  }

  // Muda o andamento. Ao concluir grava a data/hora; ao reabrir, limpa.
  async atualizarStatus(id, status) {
    await consultar(
      "UPDATE tarefas SET status = $2, concluido_em = CASE WHEN $3 THEN now() ELSE NULL END WHERE id = $1",
      [id, status, status === "CONCLUIDA"]
    );
  }

  // Apaga a tarefa; devolve quantas linhas foram removidas (0 = não existia)
  async excluir(id) {
    const { rowCount } = await consultar("DELETE FROM tarefas WHERE id = $1", [id]);
    return rowCount;
  }
}

// Instância única usada pelo restante da aplicação
export const tarefasRepositorio = new TarefasRepositorio();
