// Repositório da importação: consulta e grava movimentações vindas de um OFX, usando o model Movimentacao.
import { Op } from "sequelize";
import { Movimentacao } from "../../shared/models/index.js";

// Tamanho do lote da busca de duplicadas (evita montar uma consulta gigante para extratos grandes)
const TAMANHO_LOTE = 500;

export class ImportacaoRepositorio {
  // Dado um lote de movimentações, devolve as que já existem no banco (mesma data, valor e descrição)
  async buscarExistentes(movimentos) {
    const existentes = [];
    for (let i = 0; i < movimentos.length; i += TAMANHO_LOTE) {
      const lote = movimentos.slice(i, i + TAMANHO_LOTE);
      const encontradas = await Movimentacao.findAll({
        attributes: ["data_movimentacao", "valor", "descricao"],
        where: {
          [Op.or]: lote.map((m) => ({ data_movimentacao: m.data, valor: m.valor, descricao: m.descricao })),
        },
        raw: true,
      });
      existentes.push(...encontradas.map((r) => ({ data: r.data_movimentacao, valor: r.valor, descricao: r.descricao })));
    }
    return existentes;
  }

  // Insere o lote inteiro num único comando (rápido e atômico: ou grava tudo ou nada).
  // ignoreDuplicates vira ON CONFLICT DO NOTHING: as repetidas são puladas em vez de dar erro.
  // Devolve quantas foram gravadas (só as linhas realmente inseridas voltam com id).
  async inserirLote(movimentos, usuarioId) {
    const linhas = movimentos.map((m) => ({
      data_movimentacao: m.data,
      valor: m.valor,
      descricao: m.descricao,
      categoria: m.categoria,
      criado_por: usuarioId,
    }));
    const gravadas = await Movimentacao.bulkCreate(linhas, { ignoreDuplicates: true, returning: ["id"] });
    return gravadas.filter((g) => g.id).length;
  }
}

// Instância única usada pelo restante da aplicação
export const importacaoRepositorio = new ImportacaoRepositorio();
