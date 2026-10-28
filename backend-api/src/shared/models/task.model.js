// Model Tarefa: tabela "tarefas" (pedidos que o gestor delega para a equipe).
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Tarefa = sequelize.define(
  "Tarefa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(160), allowNull: false },
    descricao: { type: DataTypes.TEXT },
    tipo: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "GERAL" }, // GERAL ou BALANCO
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "PENDENTE" }, // PENDENTE, EM_ANDAMENTO ou CONCLUIDA
    criado_por: { type: DataTypes.INTEGER, allowNull: false }, // gestor que delegou
    atribuido_a: { type: DataTypes.INTEGER, allowNull: false }, // quem vai executar
    prazo: { type: DataTypes.DATEONLY },
    criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    concluido_em: { type: DataTypes.DATE },
  },
  { tableName: "tarefas", timestamps: false }
);
