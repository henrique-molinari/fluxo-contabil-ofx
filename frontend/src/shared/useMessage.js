// useMessage.js
// Hook que guarda a mensagem de aviso da tela (sucesso ou erro), para mostrar num <Alerta>.
//   const { mensagem, avisarOk, avisarErro } = useMensagem();
//   avisarOk("Salvo!");            // faixa verde
//   avisarErro(erro.message);      // faixa vermelha
//   <Alerta mensagem={mensagem} />
import { useState } from "react";

export function useMensagem() {
  const [mensagem, setMensagem] = useState(null); // { tipo: "ok" | "erro", texto }
  return {
    mensagem,
    avisarOk: (texto) => setMensagem({ tipo: "ok", texto }),
    avisarErro: (texto) => setMensagem({ tipo: "erro", texto }),
    limpar: () => setMensagem(null),
  };
}
