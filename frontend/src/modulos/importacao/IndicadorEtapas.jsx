// IndicadorEtapas.jsx
// Indicador do topo do assistente de importação: 1 Selecionar arquivo, 2 Conferir dados, 3 Concluído.
// "etapa" é a etapa atual (1, 2 ou 3); as anteriores aparecem marcadas com ✓.

// Nomes das etapas, na ordem
const ETAPAS = ["Selecionar arquivo", "Conferir dados", "Concluído"];

export default function IndicadorEtapas({ etapa }) {
  return (
    <ol className="etapas">
      {ETAPAS.map((nome, i) => (
        <li key={nome} className={etapa === i + 1 ? "atual" : etapa > i + 1 ? "feita" : ""}>
          <span>{etapa > i + 1 ? "✓" : i + 1}</span> {nome}
        </li>
      ))}
    </ol>
  );
}
