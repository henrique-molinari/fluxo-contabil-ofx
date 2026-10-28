// ExpenseRanking.jsx
// Tabela com as categorias ordenadas do maior para o menor gasto, com barrinha de participação.
import { dinheiro } from "../../shared/formats.js";
import Painel from "../../shared/Panel.jsx";
import Tabela from "../../shared/Table.jsx";
import { corDaCategoria } from "./theme.js";

export default function RankingGastos({ porCategoria, totalSaidas }) {
  // Porcentagem do gasto de uma categoria no total (saidas vem negativo, por isso o Math.abs)
  const percentual = (c) => (c.total / Math.abs(totalSaidas)) * 100;

  const colunas = [
    { titulo: "#", classe: "mudo", render: (c, i) => i + 1 },
    {
      titulo: "Categoria",
      render: (c, i) => (
        <>
          <span className="bolinha" style={{ background: corDaCategoria(c.categoria, i) }} />
          {c.categoria}
        </>
      ),
    },
    {
      // barrinha proporcional ao percentual
      titulo: "Participação",
      classe: "barra-celula",
      render: (c, i) => (
        <div className="barra"><div style={{ width: `${percentual(c)}%`, background: corDaCategoria(c.categoria, i) }} /></div>
      ),
    },
    { titulo: "Total gasto", alinhar: "direita", classe: "num", render: (c) => dinheiro(c.total) },
    { titulo: "%", alinhar: "direita", classe: "num mudo", render: (c) => `${percentual(c).toFixed(1)}%` },
  ];

  return (
    <Painel titulo="Ranking de gastos" subtitulo="Categorias ordenadas do maior para o menor gasto">
      <Tabela colunas={colunas} linhas={porCategoria} chave={(c) => c.categoria} rolagem={false} />
    </Painel>
  );
}
