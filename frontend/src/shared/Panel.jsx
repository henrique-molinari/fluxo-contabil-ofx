// Panel.jsx
// Cartão branco que agrupa um bloco da tela. Se receber "titulo", desenha o cabeçalho
// (título + subtítulo à esquerda e, opcionalmente, botões/controles à direita em "acoes").
//   <Painel titulo="Contas" subtitulo="Consulta" acoes={<Botao>Novo</Botao>}>...</Painel>
// "className" acrescenta classes extras (ex.: "progresso").

export default function Painel({ titulo, subtitulo, acoes, className = "", children }) {
  return (
    <section className={`painel ${className}`.trim()}>
      {titulo && (
        <div className="painel-topo">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}
