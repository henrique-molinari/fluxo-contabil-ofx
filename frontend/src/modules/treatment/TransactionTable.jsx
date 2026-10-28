// TransactionTable.jsx
// Tabela das contas. Conforme as permissões que a tela passa:
//  - podeEditar: a categoria vira um seletor (senão aparece só como etiqueta);
//  - podeComentar: aparece a coluna com o botão de comentários.
import { MessageSquare } from "lucide-react";
import { dataBR, dinheiro } from "../../shared/formats.js";
import Botao from "../../shared/Button.jsx";
import Selo from "../../shared/Badge.jsx";
import Tabela from "../../shared/Table.jsx";

export default function TabelaMovimentacoes({ movimentacoes, categorias, podeEditar, podeComentar, aoMudarCategoria, aoComentar }) {
  const colunas = [
    { titulo: "Data", classe: "num", render: (m) => dataBR(m.data_movimentacao) },
    { titulo: "Descrição", render: (m) => m.descricao },
    {
      titulo: "Categoria",
      render: (m) => podeEditar ? (
        <select value={m.categoria} onChange={(e) => aoMudarCategoria(m.id, e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
      ) : (
        <Selo>{m.categoria}</Selo>
      ),
    },
    {
      titulo: "Valor",
      alinhar: "direita",
      classe: (m) => `num ${m.valor >= 0 ? "positivo" : "negativo"}`,
      render: (m) => dinheiro(m.valor),
    },
  ];

  // A coluna de comentários só existe para quem pode ler comentários
  if (podeComentar) {
    colunas.push({
      titulo: "",
      alinhar: "direita",
      render: (m) => (
        <Botao variante="claro" pequeno icone={MessageSquare} onClick={() => aoComentar(m)}>
          {m.qtd_comentarios}
        </Botao>
      ),
    });
  }

  return <Tabela colunas={colunas} linhas={movimentacoes} chave={(m) => m.id} />;
}
