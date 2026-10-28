// usePreferencia.js
// Hook que funciona igual ao useState, mas lembra o valor no navegador (localStorage),
// mesmo depois de recarregar a página. Serve para guardar escolhas do usuário,
// como o tipo de gráfico preferido.
//   const [tipo, setTipo] = usePreferencia("grafico-saldo", "area");
import { useState } from "react";

export function usePreferencia(chave, padrao) {
  // O try/catch existe porque o localStorage pode dar erro em alguns navegadores
  const [valor, setValor] = useState(() => {
    try {
      return localStorage.getItem(chave) || padrao;
    } catch {
      return padrao;
    }
  });

  function mudar(novo) {
    setValor(novo);
    try {
      localStorage.setItem(chave, novo);
    } catch {
      /* se não deu para salvar, tudo bem: só não lembra depois */
    }
  }
  return [valor, mudar];
}
