// Model Comentario: tabela "comentarios" (observações do analista em cada conta).
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Comentario = sequelize.define(
  "Comentario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    movimentacao_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "comentarios", timestamps: false }
);
