// Repositório da importação: SQL que consulta e grava movimentações vindas de um OFX.
import { consultar } from "../../shared/db.js";

export class ImportacaoRepositorio {
  // Dado um lote de movimentações, devolve as que já existem no banco (mesma data, valor e descrição)
  async buscarExistentes(movimentos) {
    const { rows } = await consultar(
      `SELECT data_movimentacao::text AS data, valor, descricao FROM movimentacoes
        WHERE (data_movimentacao, valor, descricao) IN
              (SELECT * FROM unnest($1::date[], $2::numeric[], $3::text[]))`,
      [movimentos.map((m) => m.data), movimentos.map((m) => m.valor), movimentos.map((m) => m.descricao)]
    );
    return rows;
  }

  // Insere o lote inteiro num único comando (rápido e atômico: ou grava tudo ou nada).
  // ON CONFLICT DO NOTHING pula as duplicadas em vez de dar erro. Devolve quantas foram gravadas.
  async inserirLote(movimentos, usuarioId) {
    const { rowCount } = await consultar(
      `INSERT INTO movimentacoes (data_movimentacao, valor, descricao, categoria, criado_por)
       SELECT d, v, t, c, $5 FROM unnest($1::date[], $2::numeric[], $3::text[], $4::text[]) AS x(d, v, t, c)
       ON CONFLICT DO NOTHING`,
      [
        movimentos.map((m) => m.data),
        movimentos.map((m) => m.valor),
        movimentos.map((m) => m.descricao),
        movimentos.map((m) => m.categoria),
        usuarioId,
      ]
    );
    return rowCount;
  }
}

// Instância única usada pelo restante da aplicação
export const importacaoRepositorio = new ImportacaoRepositorio();
