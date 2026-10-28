// Model Usuario: tabela "usuarios" (quem usa o sistema e o perfil de cada um).
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false },
    senha_hash: { type: DataTypes.STRING(100), allowNull: false },
    perfil: { type: DataTypes.STRING(20), allowNull: false }, // ANALISTA, ESTAGIARIO ou GESTOR
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  // As tabelas são criadas pelas migrações em SQL (database/migrations); o model só as descreve
  { tableName: "usuarios", timestamps: false }
);
