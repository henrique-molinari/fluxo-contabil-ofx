// Repositório dos comentários: acesso ao model Comentario (e conferência da conta comentada).
import { Comentario, Movimentacao, Usuario } from "../../shared/models/index.js";

// Inclui o autor de cada comentário (só id e nome), com o relacionamento "autor" declarado em models/index.js
const COM_AUTOR = [{ model: Usuario, as: "autor", attributes: ["id", "nome"] }];

// Formato devolvido ao cliente: o comentário já com o id e o nome de quem escreveu
const paraObjeto = (c) => ({
  id: c.id,
  movimentacao_id: c.movimentacao_id,
  texto: c.texto,
  criado_em: c.criado_em,
  autor_id: c.autor.id,
  autor: c.autor.nome,
});

export class ComentariosRepositorio {
  // Comentários de uma conta, do mais antigo para o mais novo
  async listarPorMovimentacao(movimentacaoId) {
    const comentarios = await Comentario.findAll({
      where: { movimentacao_id: movimentacaoId },
      include: COM_AUTOR,
      order: [["criado_em", "ASC"]],
    });
    return comentarios.map(paraObjeto);
  }

  // Diz se a conta existe (para devolver um 404 claro antes de comentar)
  async movimentacaoExiste(movimentacaoId) {
    return (await Movimentacao.count({ where: { id: movimentacaoId } })) > 0;
  }

  // Grava o comentário e devolve já com o nome do autor
  async criar(movimentacaoId, usuarioId, texto) {
    const criado = await Comentario.create({ movimentacao_id: movimentacaoId, usuario_id: usuarioId, texto });
    const completo = await Comentario.findByPk(criado.id, { include: COM_AUTOR });
    return paraObjeto(completo);
  }

  // Busca só o autor de um comentário (usado para conferir quem pode apagar)
  async buscarAutor(id) {
    const comentario = await Comentario.findByPk(id, { attributes: ["usuario_id"], raw: true });
    return comentario?.usuario_id;
  }

  // Remove o comentário
  async apagar(id) {
    await Comentario.destroy({ where: { id } });
  }
}

// Instância única usada pelo restante da aplicação
export const comentariosRepositorio = new ComentariosRepositorio();
