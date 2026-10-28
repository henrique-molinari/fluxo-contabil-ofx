// ImportPreview.jsx
// Etapa 2 do assistente: mostra o que seria importado (novas x duplicadas) antes de gravar.
import { FileUp } from "lucide-react";
import { dataBR, dinheiro } from "../../shared/formats.js";
import Botao from "../../shared/Button.jsx";
import Painel from "../../shared/Panel.jsx";
import Selo from "../../shared/Badge.jsx";
import Tabela from "../../shared/Table.jsx";

const COLUNAS = [
  { titulo: "Data", classe: "num", render: (p) => dataBR(p.data) },
  { titulo: "Descrição", render: (p) => p.descricao },
  { titulo: "Categoria sugerida", render: (p) => <Selo>{p.categoria}</Selo> },
  {
    titulo: "Valor",
    alinhar: "direita",
    classe: (p) => `num ${p.valor >= 0 ? "positivo" : "negativo"}`,
    render: (p) => dinheiro(p.valor),
  },
  { titulo: "Situação", render: (p) => (p.duplicada ? <Selo>Duplicada</Selo> : <Selo cor="verde">Nova</Selo>) },
];

export default function PreviaImportacao({ nomeArquivo, previa, importando, aoImportar, aoEscolherOutro }) {
  // Conto quantas linhas da prévia são novas
  const novas = previa.filter((p) => !p.duplicada).length;

  return (
    <Painel
      titulo="Conferir dados"
      subtitulo={<><FileUp size={14} /> {nomeArquivo}</>}
      acoes={
        <div className="resumo-previa">
          <Selo cor="verde">{novas} novas</Selo>
          <Selo>{previa.length - novas} já existem</Selo>
        </div>
      }
    >
      <Tabela
        colunas={COLUNAS}
        linhas={previa}
        chave={(p, i) => i}
        classeLinha={(p) => (p.duplicada ? "apagada" : undefined)}
      />

      <div className="acoes">
        <Botao carregando={importando} disabled={novas === 0} onClick={aoImportar}>
          {importando ? "Importando..." : `Importar ${novas} movimentações`}
        </Botao>
        <Botao variante="claro" disabled={importando} onClick={aoEscolherOutro}>Escolher outro arquivo</Botao>
      </div>
    </Painel>
  );
}
