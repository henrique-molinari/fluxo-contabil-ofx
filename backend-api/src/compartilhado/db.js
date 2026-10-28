// Conexão com o PostgreSQL (pool de conexões compartilhado por todos os módulos).
import pg from "pg";
import { env } from "../config/env.js";

// NUMERIC (1700) chega como número e DATE (1082) como texto "AAAA-MM-DD",
// em vez de string e de objeto Date (que sofre com fuso horário).
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(1082, (v) => v);

// Pool: reaproveita até 10 conexões em vez de abrir uma por requisição
export const pool = new pg.Pool({ ...env.banco, max: 10 });

// Atalho para uma consulta simples: consultar(sql, [parametros])
// Sempre use $1, $2... (nunca concatene texto) para evitar SQL injection.
export const consultar = (sql, params) => pool.query(sql, params);

// Executa várias queries numa transação (tudo grava ou nada grava)
export async function transacao(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (e) {
    await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }
}
