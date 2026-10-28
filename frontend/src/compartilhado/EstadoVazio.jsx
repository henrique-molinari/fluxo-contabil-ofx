// EstadoVazio.jsx
// Mensagem amigável para quando não há nada para mostrar (ou para um resultado final),
// com ícone grande, título, texto e, nos filhos, botões de ação.
//  - padrão: ocupa um painel inteiro;
//  - interno: versão menor para usar dentro de outro painel;
//  - sucesso: ícone verde (usado na tela de "importação concluída").

export default function EstadoVazio({ icone: Icone, titulo, texto, interno = false, sucesso = false, children }) {
  const conteudo = (
    <>
      <div className={sucesso ? "icone-vazio sucesso" : "icone-vazio"}>
        <Icone size={interno ? 28 : 30} />
      </div>
      {titulo && <h2>{titulo}</h2>}
      {texto && <p>{texto}</p>}
      {children}
    </>
  );
  return interno ? <div className="vazio-interno">{conteudo}</div> : <div className="painel vazio">{conteudo}</div>;
}
