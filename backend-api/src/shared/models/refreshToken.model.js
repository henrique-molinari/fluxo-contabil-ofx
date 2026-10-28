// Model RefreshToken: tabela "refresh_tokens" (guarda só o hash do token, nunca o token em si).
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expira_em: { type: DataTypes.DATE, allowNull: false },
    revogado_em: { type: DataTypes.DATE, allowNull: true },
    criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "refresh_tokens", timestamps: false }
);
