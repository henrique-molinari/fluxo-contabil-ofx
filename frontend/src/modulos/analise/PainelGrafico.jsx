// PainelGrafico.jsx
// Painel de um gráfico: título, subtítulo, seletor do tipo de gráfico e o gráfico em si (filho).
// Os três gráficos do painel de análise usam este mesmo molde.
import Painel from "../../compartilhado/Painel.jsx";
import SeletorGrafico from "./SeletorGrafico.jsx";

export default function PainelGrafico({ titulo, subtitulo, opcoes, tipo, aoMudarTipo, children }) {
  return (
    <Painel
      titulo={titulo}
      subtitulo={subtitulo}
      acoes={<SeletorGrafico opcoes={opcoes} valor={tipo} aoMudar={aoMudarTipo} />}
    >
      {children}
    </Painel>
  );
}
