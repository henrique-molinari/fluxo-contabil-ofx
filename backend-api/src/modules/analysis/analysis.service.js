// Regras do painel de análise: totais, gastos por categoria, comparação mensal e evolução do saldo.
import { analiseRepositorio } from "./analysis.repository.js";

// Evita dízimas do JavaScript (0.1 + 0.2) arredondando para 2 casas
const arredondar = (n) => Math.round(n * 100) / 100;

// Função pura (sem banco): recebe as movimentações e devolve totais e dados dos gráficos.
// Por ser pura, é fácil de testar. Entradas = valor positivo, saídas = valor negativo.
export function calcularResumo(movimentos) {
  let entradas = 0, saidas = 0, qtdEntradas = 0, qtdSaidas = 0;
  const porCategoria = {}; // só as saídas (gastos)
  const porMes = {};
  const porDia = {};       // movimento líquido do dia, para o saldo acumulado

  for (const { data_movimentacao: dia, valor, categoria } of movimentos) {
    const mes = dia.slice(0, 7);
    porMes[mes] ??= { mes, entradas: 0, saidas: 0 };
    porDia[dia] = (porDia[dia] ?? 0) + valor;

    if (valor > 0) {
      entradas += valor; qtdEntradas++;
      porMes[mes].entradas += valor;
    } else {
      saidas += valor; qtdSaidas++;
      porMes[mes].saidas += Math.abs(valor);
      porCategoria[categoria] = (porCategoria[categoria] ?? 0) + Math.abs(valor);
    }
  }

  // Saldo acumulado dia a dia, em ordem cronológica (alimenta o gráfico de linha)
  let acumulado = 0;
  const evolucao = Object.keys(porDia).sort().map((dia) => {
    acumulado += porDia[dia];
    return { dia, saldo: arredondar(acumulado) };
  });

  return {
    entradas: arredondar(entradas),
    saidas: arredondar(saidas),
    saldo: arredondar(entradas + saidas),
    quantidade: movimentos.length,
    qtd_entradas: qtdEntradas,
    qtd_saidas: qtdSaidas,
    evolucao,
    por_categoria: Object.entries(porCategoria)
      .map(([categoria, total]) => ({ categoria, total: arredondar(total) }))
      .sort((a, b) => b.total - a.total),
    por_mes: Object.values(porMes)
      .map((m) => ({ mes: m.mes, entradas: arredondar(m.entradas), saidas: arredondar(m.saidas) }))
      .sort((a, b) => a.mes.localeCompare(b.mes)),
  };
}

export class AnaliseServico {
  constructor(repositorio = analiseRepositorio) {
    this.repositorio = repositorio;
  }

  // Busca as movimentações do período e calcula o resumo
  async resumo(periodo) {
    return calcularResumo(await this.repositorio.listarPeriodo(periodo));
  }
}

// Instância única usada pelas rotas
export const analiseServico = new AnaliseServico();
