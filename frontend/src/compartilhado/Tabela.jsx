// Tabela.jsx
// Tabela genérica: em vez de repetir <table><thead>...</thead><tbody>...</tbody></table> em cada tela,
// a tela só descreve as colunas.
//
//   <Tabela
//     linhas={lista}
//     chave={(linha) => linha.id}
//     colunas={[
//       { titulo: "Nome", render: (linha) => linha.nome },
//       { titulo: "Valor", alinhar: "direita", classe: "num", render: (linha) => dinheiro(linha.valor) },
//     ]}
//   />
//
// Cada coluna aceita:
//  - titulo: texto do cabeçalho (use "" para uma coluna sem título, como a de botões);
//  - render(linha, indice): o que aparece na célula;
//  - alinhar: "direita" para alinhar à direita;
//  - classe: classe extra da célula (texto fixo ou função que recebe a linha).
// "classeLinha" (opcional) devolve uma classe para a linha inteira, ex.: "apagada".
// "rolagem={false}" tira a caixa com barra de rolagem em volta da tabela.

export default function Tabela({ colunas, linhas, chave, classeLinha, rolagem = true }) {
  const tabela = (
    <table>
      <thead>
        <tr>
          {colunas.map((c, i) => (
            <th key={i} className={c.alinhar}>{c.titulo}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, indice) => (
          <tr key={chave(linha, indice)} className={classeLinha?.(linha)}>
            {colunas.map((c, i) => {
              // A classe da célula junta o alinhamento com a classe extra da coluna
              const extra = typeof c.classe === "function" ? c.classe(linha) : c.classe;
              const classe = [c.alinhar, extra].filter(Boolean).join(" ") || undefined;
              return <td key={i} className={classe}>{c.render(linha, indice)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return rolagem ? <div className="tabela-rolagem">{tabela}</div> : tabela;
}
