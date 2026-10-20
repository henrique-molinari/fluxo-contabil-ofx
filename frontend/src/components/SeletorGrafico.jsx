// SeletorGrafico.jsx
// Botõezinhos pra trocar o tipo do gráfico (rosca, barras, linha...).
// Também fiz um "hook" que lembra a escolha do usuário mesmo se ele recarregar a página
// (usei o localStorage do navegador pra isso).
import { useState } from "react";

// Hook: funciona igual o useState, mas guarda o valor no navegador.
// O try/catch é porque o localStorage pode dar erro em alguns navegadores.
export function usePreferencia(chave, padrao) {
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
      /* se não deu pra salvar, tudo bem, só não lembra depois */
    }
  }
  return [valor, mudar];
}

// opcoes = [{ id, nome, Icone }]
export default function SeletorGrafico({ opcoes, valor, aoMudar }) {
  return (
    <div className="seletor" role="group" aria-label="Tipo de gráfico">
      {opcoes.map(({ id, nome, Icone }) => (
        <button
          key={id}
          type="button"
          className={id === valor ? "ativo" : ""}
          onClick={() => aoMudar(id)}
          title={nome}
          aria-pressed={id === valor}
        >
          <Icone size={16} />
          <span>{nome}</span>
        </button>
      ))}
    </div>
  );
}
