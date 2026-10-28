// TaskTable.jsx
// Tabela das tarefas. Para o gestor (ehGestor) mostra o responsável e o botão de excluir;
// para os demais mostra quem pediu a tarefa. Todos mudam o andamento pelo seletor.
import { Trash2 } from "lucide-react";
import { dataBR } from "../../shared/formats.js";
import Selo from "../../shared/Badge.jsx";
import Tabela from "../../shared/Table.jsx";
import { STATUS, TIPOS } from "./constants.js";

export default function TabelaTarefas({ tarefas, ehGestor, aoMudarStatus, aoExcluir }) {
  const colunas = [
    {
      titulo: "Tarefa",
      render: (t) => (
        <>
          <b>{t.titulo}</b>
          {t.descricao && <div className="mudo">{t.descricao}</div>}
        </>
      ),
    },
    { titulo: "Tipo", render: (t) => <Selo>{TIPOS[t.tipo]}</Selo> },
    { titulo: ehGestor ? "Responsável" : "Pedida por", render: (t) => (ehGestor ? t.atribuido_a_nome : t.criado_por_nome) },
    { titulo: "Prazo", classe: "num", render: (t) => (t.prazo ? dataBR(t.prazo) : "—") },
    {
      titulo: "Situação",
      render: (t) => (
        <select value={t.status} onChange={(e) => aoMudarStatus(t.id, e.target.value)}>
          {Object.entries(STATUS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      ),
    },
  ];

  // Só o gestor exclui tarefas
  if (ehGestor) {
    colunas.push({
      titulo: "",
      alinhar: "direita",
      render: (t) => (
        <button className="icone-botao" onClick={() => aoExcluir(t.id)} aria-label="Excluir tarefa">
          <Trash2 size={16} />
        </button>
      ),
    });
  }

  return (
    <Tabela
      colunas={colunas}
      linhas={tarefas}
      chave={(t) => t.id}
      classeLinha={(t) => (t.status === "CONCLUIDA" ? "apagada" : undefined)}
    />
  );
}
