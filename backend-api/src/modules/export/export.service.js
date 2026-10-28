// Regras da exportação: escolhe o gerador pelo formato e monta o arquivo.
import { ErroHttp } from "../../shared/errors.js";
import { exportacaoRepositorio } from "./export.repository.js";
import { FORMATOS } from "./formats.js";

export class ExportacaoServico {
  // Repositório e geradores entram pelo construtor para facilitar os testes
  constructor(repositorio = exportacaoRepositorio, formatos = FORMATOS) {
    this.repositorio = repositorio;
    this.formatos = formatos;
  }

  // Devolve { buffer, tipo, nome } com todas as contas no formato pedido
  async exportar(formato) {
    const movimentacoes = await this.repositorio.listarTodas();
    // Um OFX sem nenhuma transação não serve para nada
    if (formato === "ofx" && movimentacoes.length === 0) {
      throw new ErroHttp(400, "Não há movimentações para exportar.");
    }
    const { buffer, tipo } = await this.formatos[formato](movimentacoes);
    return { buffer, tipo, nome: `movimentacoes.${formato}` };
  }
}

// Instância única usada pelas rotas
export const exportacaoServico = new ExportacaoServico();
