// CartaoFormato.jsx
// Cartão de um formato de exportação: ícone, nome, explicação e o botão de baixar.
// "gerando" mostra o estado de carregamento neste cartão; "bloqueado" trava o botão
// quando outro arquivo está sendo gerado.
import { Download } from "lucide-react";
import Botao from "../../compartilhado/Botao.jsx";

export default function CartaoFormato({ formato, gerando, bloqueado, aoBaixar }) {
  const { id, titulo, Icone, texto } = formato;
  return (
    <div className="formato">
      <div className="kpi-icone verde"><Icone size={22} /></div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      <Botao icone={Download} carregando={gerando} disabled={bloqueado} onClick={() => aoBaixar(id)}>
        {gerando ? "Gerando..." : `Baixar .${id}`}
      </Botao>
    </div>
  );
}
