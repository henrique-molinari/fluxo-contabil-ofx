// SeletorGrafico.jsx
// Botõezinhos pra trocar o tipo do gráfico (rosca, barras, linha...).
// Para lembrar a escolha do usuário use o hook usePreferencia (em compartilhado/).

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
