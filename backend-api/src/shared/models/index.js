// Reúne todos os models e declara os relacionamentos entre eles (chaves estrangeiras).
// Os repositórios importam os models daqui.
import { Comentario } from "./comment.model.js";
import { Movimentacao } from "./transaction.model.js";
import { RefreshToken } from "./refreshToken.model.js";
import { Tarefa } from "./task.model.js";
import { Usuario } from "./user.model.js";

// Um usuário tem vários refresh tokens (apagar o usuário apaga os tokens)
Usuario.hasMany(RefreshToken, { foreignKey: "usuario_id", onDelete: "CASCADE" });
RefreshToken.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Uma conta tem vários comentários (apagar a conta apaga os comentários)
Movimentacao.hasMany(Comentario, { foreignKey: "movimentacao_id", onDelete: "CASCADE" });
Comentario.belongsTo(Movimentacao, { foreignKey: "movimentacao_id" });
// Cada comentário tem um autor
Comentario.belongsTo(Usuario, { foreignKey: "usuario_id", as: "autor" });

// Cada tarefa tem quem criou (gestor) e quem deve executá-la
Tarefa.belongsTo(Usuario, { foreignKey: "criado_por", as: "criador" });
Tarefa.belongsTo(Usuario, { foreignKey: "atribuido_a", as: "responsavel" });

export { Comentario, Movimentacao, RefreshToken, Tarefa, Usuario };
