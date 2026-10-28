// Repositório da exportação: busca as movimentações que vão para o arquivo (model Movimentacao).
import { Movimentacao } from "../../shared/models/index.js";

export class ExportacaoRepositorio {
  // Todas as contas, da mais recente para a mais antiga
  async listarTodas() {
    return Movimentacao.findAll({
      attributes: ["id", "data_movimentacao", "valor", "descricao", "categoria"],
      order: [["data_movimentacao", "DESC"], ["id", "DESC"]],
      raw: true,
    });
  }
}

// Instância única usada pelo restante da aplicação
export const exportacaoRepositorio = new ExportacaoRepositorio();
