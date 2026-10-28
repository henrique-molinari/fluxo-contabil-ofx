// Repositório da análise: busca as movimentações que alimentam os gráficos.
import { consultar } from "../../shared/db.js";

export class AnaliseRepositorio {
  // Movimentações do período (filtros nulos são ignorados)
  async listarPeriodo({ de, ate }) {
    const { rows } = await consultar(
      `SELECT data_movimentacao, valor, categoria FROM movimentacoes
        WHERE ($1::date IS NULL OR data_movimentacao >= $1)
          AND ($2::date IS NULL OR data_movimentacao <= $2)`,
      [de ?? null, ate ?? null]
    );
    return rows;
  }
}

// Instância única usada pelo restante da aplicação
export const analiseRepositorio = new AnaliseRepositorio();
