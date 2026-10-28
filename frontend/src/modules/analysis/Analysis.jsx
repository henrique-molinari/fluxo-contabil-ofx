// Analysis.jsx
// Módulo de análise: cards com os totais e três gráficos.
// Em cada gráfico o usuário pode trocar o tipo (rosca, barras, linha...) e a escolha fica salva.
// Enquanto os dados não chegam do backend eu mostro animação de carregamento.
import { Inbox } from "lucide-react";
import Alerta from "../../shared/Alert.jsx";
import Botao from "../../shared/Button.jsx";
import { Carregando, Esqueleto } from "../../shared/Loading.jsx";
import EstadoVazio from "../../shared/EmptyState.jsx";
import { usePreferencia } from "../../shared/usePreference.js";
import { useRequisicao } from "../../shared/useRequest.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { analiseApi } from "./analysis.api.js";
import CartoesResumo from "./SummaryCards.jsx";
import GraficoCategorias from "./CategoryChart.jsx";
import GraficoMensal from "./MonthlyChart.jsx";
import GraficoSaldo from "./BalanceChart.jsx";
import PainelGrafico from "./ChartPanel.jsx";
import RankingGastos from "./ExpenseRanking.jsx";
import { TIPOS_CATEGORIA, TIPOS_MENSAL, TIPOS_SALDO } from "./chartTypes.js";

// Painel: cartões de totais + gráficos. Os dados vêm prontos de /api/analise/resumo.
export default function Analise({ irPara }) {
  const { pode } = useAuth();
  const { dados: resumo, erro } = useRequisicao(() => analiseApi.resumo());

  // O tipo escolhido de cada gráfico fica salvo no navegador
  const [tipoCategoria, setTipoCategoria] = usePreferencia("grafico-categoria", "rosca");
  const [tipoMensal, setTipoMensal] = usePreferencia("grafico-mensal", "barras");
  const [tipoSaldo, setTipoSaldo] = usePreferencia("grafico-saldo", "area");

  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;

  // Ainda carregando: mostro os esqueletos piscando + o spinner
  if (!resumo) {
    return (
      <>
        <section className="cards">
          {[1, 2, 3, 4].map((n) => <Esqueleto key={n} altura={118} />)}
        </section>
        <Esqueleto altura={120} />
        <Carregando texto="Calculando a análise financeira..." />
      </>
    );
  }

  // Se ainda não tem nada no banco, aviso o usuário e ofereço o botão de importar
  if (resumo.quantidade === 0) {
    return (
      <EstadoVazio
        icone={Inbox}
        titulo="Ainda não há movimentações"
        texto="Quando um extrato OFX for importado, os gráficos aparecem aqui."
      >
        {pode("importacao:criar") && <Botao onClick={() => irPara("importacao")}>Ir para Importação</Botao>}
      </EstadoVazio>
    );
  }

  return (
    <>
      <CartoesResumo resumo={resumo} />

      <section className="graficos">
        <PainelGrafico
          titulo="Gastos por categoria"
          subtitulo="Para onde foi o dinheiro das saídas"
          opcoes={TIPOS_CATEGORIA}
          tipo={tipoCategoria}
          aoMudarTipo={setTipoCategoria}
        >
          <GraficoCategorias dados={resumo.por_categoria} tipo={tipoCategoria} />
        </PainelGrafico>

        <PainelGrafico
          titulo="Entradas e saídas por mês"
          subtitulo="Comparação mês a mês"
          opcoes={TIPOS_MENSAL}
          tipo={tipoMensal}
          aoMudarTipo={setTipoMensal}
        >
          <GraficoMensal dados={resumo.por_mes} tipo={tipoMensal} />
        </PainelGrafico>
      </section>

      {/* Evolução do saldo (ocupa a linha toda) */}
      <PainelGrafico
        titulo="Evolução do saldo"
        subtitulo="Saldo acumulado dia após dia"
        opcoes={TIPOS_SALDO}
        tipo={tipoSaldo}
        aoMudarTipo={setTipoSaldo}
      >
        <GraficoSaldo dados={resumo.evolucao} tipo={tipoSaldo} />
      </PainelGrafico>

      <RankingGastos porCategoria={resumo.por_categoria} totalSaidas={resumo.saidas} />
    </>
  );
}
