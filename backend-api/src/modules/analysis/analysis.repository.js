// Repositório da análise: busca as movimentações que alimentam os gráficos (model Movimentacao).
import { Op } from "sequelize";
import { Movimentacao } from "../../shared/models/index.js";

export class AnaliseRepositorio {
  // Movimentações do período (só entram os filtros que foram enviados)
  async listarPeriodo({ de, ate }) {
    const filtros = [];
    if (de) filtros.push({ data_movimentacao: { [Op.gte]: de } });
    if (ate) filtros.push({ data_movimentacao: { [Op.lte]: ate } });

    return Movimentacao.findAll({
      attributes: ["data_movimentacao", "valor", "categoria"],
      where: { [Op.and]: filtros },
      raw: true,
    });
  }
}

// Instância única usada pelo restante da aplicação
export const analiseRepositorio = new AnaliseRepositorio();
