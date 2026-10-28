// Repositório da exportação: busca as movimentações que vão para o arquivo.
import { consultar } from "../../shared/db.js";

export class ExportacaoRepositorio {
  // Todas as contas, da mais recente para a mais antiga
  async listarTodas() {
    const { rows } = await consultar(
      "SELECT id, data_movimentacao, valor, descricao, categoria FROM movimentacoes ORDER BY data_movimentacao DESC, id DESC"
    );
    return rows;
  }
}

// Instância única usada pelo restante da aplicação
export const exportacaoRepositorio = new ExportacaoRepositorio();
