// Regras da importação de extratos OFX: ler o arquivo, mostrar a prévia e gravar.
import { ErroHttp } from "../../shared/errors.js";
import { importacaoRepositorio } from "./import.repository.js";
import { lerOfx } from "./ofx.parser.js";

// Identifica uma movimentação igual a outra (mesma regra do índice único do banco)
const chave = (m) => `${m.data}|${Number(m.valor).toFixed(2)}|${m.descricao}`;

export class ImportacaoServico {
  // Repositório e leitor de OFX entram pelo construtor para facilitar os testes
  constructor(repositorio = importacaoRepositorio, leitor = lerOfx) {
    this.repositorio = repositorio;
    this.leitor = leitor;
  }

  // Confere que veio um arquivo e já converte o OFX em lista de movimentações
  lerArquivo(arquivo) {
    if (!arquivo) throw new ErroHttp(400, "Nenhum arquivo enviado. Use o campo 'arquivo'.");
    return this.leitor(arquivo.buffer);
  }

  // Mostra o que seria importado, marcando as que já existem (não grava nada)
  async previa(arquivo) {
    const movimentos = this.lerArquivo(arquivo);
    const existentes = new Set((await this.repositorio.buscarExistentes(movimentos)).map(chave));
    return movimentos.map((m) => ({ ...m, duplicada: existentes.has(chave(m)) }));
  }

  // Importação de verdade: grava as novas e conta as duplicadas que foram puladas
  async importar(arquivo, usuario) {
    const movimentos = this.lerArquivo(arquivo);
    const inseridas = await this.repositorio.inserirLote(movimentos, usuario.id);
    return { inseridas, duplicadas: movimentos.length - inseridas };
  }
}

// Instância única usada pelas rotas
export const importacaoServico = new ImportacaoServico();
