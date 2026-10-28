// Model Movimentacao: tabela "movimentacoes" (as contas do extrato, já com categoria e auditoria).
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Movimentacao = sequelize.define(
  "Movimentacao",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // DATEONLY devolve "AAAA-MM-DD" (texto), sem problema de fuso horário
    data_movimentacao: { type: DataTypes.DATEONLY },
    // Entradas são positivas e saídas negativas
    valor: { type: DataTypes.DECIMAL(15, 2) },
    descricao: { type: DataTypes.STRING(255) },
    categoria: { type: DataTypes.STRING(50), defaultValue: "Sem categoria" },
    // Auditoria: quem criou/alterou e quando
    criado_por: { type: DataTypes.INTEGER },
    alterado_por: { type: DataTypes.INTEGER },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    alterado_em: { type: DataTypes.DATE },
  },
  { tableName: "movimentacoes", timestamps: false }
);
