// Repositório dos comentários: SQL da tabela "comentarios" (e conferência da conta comentada).
import { consultar } from "../../shared/db.js";

// Consulta base: traz o comentário já com o nome de quem escreveu
const SELECT = `SELECT c.id, c.movimentacao_id, c.texto, c.criado_em, u.id AS autor_id, u.nome AS autor
                  FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id`;

export class ComentariosRepositorio {
  // Comentários de uma conta, do mais antigo para o mais novo
  async listarPorMovimentacao(movimentacaoId) {
    const { rows } = await consultar(`${SELECT} WHERE c.movimentacao_id = $1 ORDER BY c.criado_em`, [movimentacaoId]);
    return rows;
  }

  // Diz se a conta existe (para devolver um 404 claro antes de comentar)
  async movimentacaoExiste(movimentacaoId) {
    const { rowCount } = await consultar("SELECT 1 FROM movimentacoes WHERE id = $1", [movimentacaoId]);
    return rowCount > 0;
  }

  // Grava o comentário e devolve já com o nome do autor
  async criar(movimentacaoId, usuarioId, texto) {
    const { rows } = await consultar(
      "INSERT INTO comentarios (movimentacao_id, usuario_id, texto) VALUES ($1, $2, $3) RETURNING id",
      [movimentacaoId, usuarioId, texto]
    );
    const { rows: criado } = await consultar(`${SELECT} WHERE c.id = $1`, [rows[0].id]);
    return criado[0];
  }

  // Busca só o autor de um comentário (usado para conferir quem pode apagar)
  async buscarAutor(id) {
    const { rows } = await consultar("SELECT usuario_id FROM comentarios WHERE id = $1", [id]);
    return rows[0]?.usuario_id;
  }

  // Remove o comentário
  async apagar(id) {
    await consultar("DELETE FROM comentarios WHERE id = $1", [id]);
  }
}

// Instância única usada pelo restante da aplicação
export const comentariosRepositorio = new ComentariosRepositorio();
