// ResultadoImportacao.jsx
// Etapa 3 do assistente: resumo do que foi gravado e atalhos para os próximos passos.
import { CircleCheck } from "lucide-react";
import Botao from "../../compartilhado/Botao.jsx";
import EstadoVazio from "../../compartilhado/EstadoVazio.jsx";

// resultado = { inseridas, duplicadas } devolvido pela API
export default function ResultadoImportacao({ resultado, podeVerAnalise, aoImportarOutro, irPara }) {
  return (
    <EstadoVazio
      sucesso
      icone={CircleCheck}
      titulo="Importação concluída"
      texto={
        <>
          <b>{resultado.inseridas}</b> movimentações inseridas e{" "}
          <b>{resultado.duplicadas}</b> duplicadas ignoradas.
        </>
      }
    >
      <div className="acoes centro">
        <Botao onClick={aoImportarOutro}>Importar novo OFX</Botao>
        <Botao variante="claro" onClick={() => irPara("tratamento")}>Ver contas</Botao>
        {podeVerAnalise && <Botao variante="claro" onClick={() => irPara("analise")}>Ver análise</Botao>}
      </div>
    </EstadoVazio>
  );
}
