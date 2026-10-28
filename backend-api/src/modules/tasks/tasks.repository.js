// Repositório de tarefas: acesso ao model Tarefa (com o nome de quem criou e de quem recebeu).
import { literal } from "sequelize";
import { Tarefa, Usuario } from "../../shared/models/index.js";

// Traz junto o criador e o responsável (relacionamentos declarados em models/index.js)
const COM_PESSOAS = [
  { model: Usuario, as: "criador", attributes: ["nome"] },
  { model: Usuario, as: "responsavel", attributes: ["nome"] },
];

// Formato devolvido ao cliente: a tarefa com os nomes de quem criou e de quem recebeu
const paraObjeto = (t) => ({
  id: t.id,
  titulo: t.titulo,
  descricao: t.descricao,
  tipo: t.tipo,
  status: t.status,
  prazo: t.prazo,
  criado_em: t.criado_em,
  concluido_em: t.concluido_em,
  criado_por: t.criado_por,
  criado_por_nome: t.criador.nome,
  atribuido_a: t.atribuido_a,
  atribuido_a_nome: t.responsavel.nome,
});

export class TarefasRepositorio {
  // Lista: pendentes primeiro, depois por prazo mais próximo. Filtros nulos são ignorados.
  async listar({ dono, status }) {
    const filtros = {};
    if (dono != null) filtros.atribuido_a = dono;
    if (status != null) filtros.status = status;

    const tarefas = await Tarefa.findAll({
      where: filtros,
      include: COM_PESSOAS,
      order: [
        [literal(`("Tarefa"."status" = 'CONCLUIDA')`), "ASC"], // concluídas por último
        ["prazo", "ASC NULLS LAST"],
        ["criado_em", "DESC"],
      ],
    });
    return tarefas.map(paraObjeto);
  }

  // Busca uma tarefa completa pelo id (undefined se não existir)
  async buscarPorId(id) {
    const tarefa = await Tarefa.findByPk(id, { include: COM_PESSOAS });
    return tarefa ? paraObjeto(tarefa) : undefined;
  }

  // Diz se o usuário existe e está ativo (só se atribui tarefa a quem pode trabalhar)
  async usuarioAtivo(id) {
    const usuario = await Usuario.findByPk(id, { attributes: ["ativo"], raw: true });
    return Boolean(usuario?.ativo);
  }

  // Grava a tarefa e devolve o id criado
  async criar({ titulo, descricao, tipo, atribuido_a, prazo }, criadoPor) {
    const criada = await Tarefa.create({
      titulo,
      descricao: descricao ?? null,
      tipo,
      atribuido_a,
      prazo: prazo ?? null,
      criado_por: criadoPor,
    });
    return criada.id;
  }

  // Muda o andamento. Ao concluir grava a data/hora; ao reabrir, limpa.
  async atualizarStatus(id, status) {
    await Tarefa.update(
      { status, concluido_em: status === "CONCLUIDA" ? new Date() : null },
      { where: { id } }
    );
  }

  // Apaga a tarefa; devolve quantas linhas foram removidas (0 = não existia)
  async excluir(id) {
    return Tarefa.destroy({ where: { id } });
  }
}

// Instância única usada pelo restante da aplicação
export const tarefasRepositorio = new TarefasRepositorio();
