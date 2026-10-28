// ClassificationProgress.jsx
// Cartão com a porcentagem de contas que já têm categoria e uma barra de progresso.
import Painel from "../../shared/Panel.jsx";

export default function ProgressoClassificacao({ total, pendentes }) {
  const classificadas = total - pendentes;
  const progresso = Math.round((classificadas / total) * 100);

  return (
    <Painel className="progresso">
      <div className="progresso-texto">
        <h2>{progresso}% classificado</h2>
        <p>{classificadas} de {total} contas já têm categoria · {pendentes} pendentes</p>
      </div>
      <div className="barra grande"><div style={{ width: `${progresso}%` }} /></div>
    </Painel>
  );
}
