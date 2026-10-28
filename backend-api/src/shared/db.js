// Conexão com o PostgreSQL, compartilhada por todos os módulos.
// Usamos o Sequelize (ORM): os models ficam em shared/models/ e os repositórios dos módulos
// falam com o banco através deles.
import pg from "pg";
import { Sequelize } from "sequelize";
import { env } from "../config/env.js";

// NUMERIC (1700) chega como número e DATE (1082) como texto "AAAA-MM-DD",
// em vez de string e de objeto Date (que sofre com fuso horário).
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(1082, (v) => v);

// O Sequelize devolve DECIMAL como texto; aqui pedimos número (ex.: "4500.00" vira 4500).
Sequelize.postgres.DECIMAL.parse = (v) => parseFloat(v);

// Instância do Sequelize: reaproveita até 10 conexões em vez de abrir uma por requisição.
// "logging: false" desliga o SQL no console (ligue para estudar as queries geradas).
export const sequelize = new Sequelize(env.banco.database, env.banco.user, env.banco.password, {
  host: env.banco.host,
  port: env.banco.port,
  dialect: "postgres",
  logging: false,
  pool: { max: 10 },
  // ssl é sempre informado (false quando não se exige SSL), senão o driver tentaria usar o PGSSLMODE do ambiente
  dialectOptions: { ssl: env.banco.ssl },
});
