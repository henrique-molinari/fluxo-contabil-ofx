// Analise.jsx
// Módulo de análise: cards com os totais e três gráficos.
// Em cada gráfico o usuário pode trocar o tipo (rosca, barras, linha...).
// Enquanto os dados não chegam do backend eu mostro animação de carregamento.
import { useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, ChartArea, ChartBar, ChartColumn,
  ChartLine, ChartPie, Donut, Inbox, ReceiptText, Wallet,
} from "lucide-react";
import { analiseApi } from "./analise.api.js";
import { dinheiro } from "../../compartilhado/formatos.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Carregando, Esqueleto } from "../../compartilhado/Carregando.jsx";
import SeletorGrafico, { usePreferencia } from "./SeletorGrafico.jsx";
import { GraficoCategorias, GraficoMensal, GraficoSaldo } from "./Graficos.jsx";
import { corDaCategoria } from "./tema.js";

// Tipos de gráfico disponíveis em cada painel
const TIPOS_CATEGORIA = [
  { id: "rosca", nome: "Rosca", Icone: Donut },
  { id: "pizza", nome: "Pizza", Icone: ChartPie },
  { id: "barras", nome: "Colunas", Icone: ChartColumn },
  { id: "horizontal", nome: "Barras", Icone: ChartBar },
];
const TIPOS_MENSAL = [
  { id: "barras", nome: "Colunas", Icone: ChartColumn },
  { id: "linha", nome: "Linha", Icone: ChartLine },
  { id: "area", nome: "Área", Icone: ChartArea },
];
const TIPOS_SALDO = [
  { id: "area", nome: "Área", Icone: ChartArea },
  { id: "linha", nome: "Linha", Icone: ChartLine },
];

// Painel: cartões de totais + gráficos. Os dados vêm prontos de /api/analise/resumo.
export default function Analise({ irPara }) {
  const { pode } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState("");

  // O tipo escolhido de cada gráfico fica salvo no navegador
  const [tipoCategoria, setTipoCategoria] = usePreferencia("grafico-categoria", "rosca");
  const [tipoMensal, setTipoMensal] = usePreferencia("grafico-mensal", "barras");
  const [tipoSaldo, setTipoSaldo] = usePreferencia("grafico-saldo", "area");

  // Quando a tela abre, busco os números no backend
  useEffect(() => {
    analiseApi.resumo().then(setResumo).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="alerta erro">{erro}</div>;

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
      <div className="painel vazio">
        <div className="icone-vazio"><Inbox size={30} /></div>
        <h2>Ainda não há movimentações</h2>
        <p>Quando um extrato OFX for importado, os gráficos aparecem aqui.</p>
        {pode("importacao:criar") && (
          <button className="botao" onClick={() => irPara("importacao")}>Ir para Importação</button>
        )}
      </div>
    );
  }

  // Dados dos cards (cada um com ícone, cor e uma frase de apoio)
  const cards = [
    { titulo: "Entradas", valor: dinheiro(resumo.entradas), apoio: `${resumo.qtd_entradas} lançamentos`, Icone: ArrowDownLeft, cor: "verde" },
    { titulo: "Saídas", valor: dinheiro(Math.abs(resumo.saidas)), apoio: `${resumo.qtd_saidas} lançamentos`, Icone: ArrowUpRight, cor: "petroleo" },
    { titulo: "Saldo", valor: dinheiro(resumo.saldo), apoio: resumo.saldo >= 0 ? "Resultado positivo" : "Resultado negativo", Icone: Wallet, cor: "verde" },
    { titulo: "Movimentações", valor: resumo.quantidade, apoio: "No período importado", Icone: ReceiptText, cor: "neutro" },
  ];

  return (
    <>
      {/* Cards de resumo */}
      <section className="cards">
        {cards.map(({ titulo, valor, apoio, Icone, cor }) => (
          <div className="kpi" key={titulo}>
            <div className={`kpi-icone ${cor}`}><Icone size={20} /></div>
            <span className="kpi-titulo">{titulo}</span>
            <strong className="kpi-valor">{valor}</strong>
            <span className="kpi-apoio">{apoio}</span>
          </div>
        ))}
      </section>

      <section className="graficos">
        {/* Gastos por categoria */}
        <div className="painel">
          <div className="painel-topo">
            <div>
              <h2>Gastos por categoria</h2>
              <p>Para onde foi o dinheiro das saídas</p>
            </div>
            <SeletorGrafico opcoes={TIPOS_CATEGORIA} valor={tipoCategoria} aoMudar={setTipoCategoria} />
          </div>
          <GraficoCategorias dados={resumo.por_categoria} tipo={tipoCategoria} />
        </div>

        {/* Entradas x saídas por mês */}
        <div className="painel">
          <div className="painel-topo">
            <div>
              <h2>Entradas e saídas por mês</h2>
              <p>Comparação mês a mês</p>
            </div>
            <SeletorGrafico opcoes={TIPOS_MENSAL} valor={tipoMensal} aoMudar={setTipoMensal} />
          </div>
          <GraficoMensal dados={resumo.por_mes} tipo={tipoMensal} />
        </div>
      </section>

      {/* Evolução do saldo (ocupa a linha toda) */}
      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Evolução do saldo</h2>
            <p>Saldo acumulado dia após dia</p>
          </div>
          <SeletorGrafico opcoes={TIPOS_SALDO} valor={tipoSaldo} aoMudar={setTipoSaldo} />
        </div>
        <GraficoSaldo dados={resumo.evolucao} tipo={tipoSaldo} />
      </section>

      {/* Tabela com o ranking dos gastos */}
      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Ranking de gastos</h2>
            <p>Categorias ordenadas do maior para o menor gasto</p>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Categoria</th><th>Participação</th><th className="direita">Total gasto</th><th className="direita">%</th></tr>
          </thead>
          <tbody>
            {resumo.por_categoria.map((c, i) => {
              // saidas vem negativo, por isso o Math.abs
              const percentual = (c.total / Math.abs(resumo.saidas)) * 100;
              return (
                <tr key={c.categoria}>
                  <td className="mudo">{i + 1}</td>
                  <td>
                    <span className="bolinha" style={{ background: corDaCategoria(c.categoria, i) }} />
                    {c.categoria}
                  </td>
                  {/* barrinha proporcional ao percentual */}
                  <td className="barra-celula">
                    <div className="barra"><div style={{ width: `${percentual}%`, background: corDaCategoria(c.categoria, i) }} /></div>
                  </td>
                  <td className="direita num">{dinheiro(c.total)}</td>
                  <td className="direita num mudo">{percentual.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
