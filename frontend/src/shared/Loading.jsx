// Loading.jsx
// Componentes de animação de carregamento:
//  - Carregando: círculo girando com um texto (pra telas inteiras)
//  - MiniSpinner: bolinha pequena pra usar dentro de botões
//  - Esqueleto: bloco que "brilha" enquanto o conteúdo não chega
// O estilo da animação está no index.css.

export function Carregando({ texto = "Carregando dados..." }) {
  return (
    <div className="carregando" role="status">
      <div className="spinner" />
      <span>{texto}</span>
    </div>
  );
}

export function MiniSpinner() {
  return <span className="mini-spinner" aria-hidden="true" />;
}

// Passo a altura (e opcionalmente a largura) e ele desenha o bloco
export function Esqueleto({ altura = 80, largura = "100%" }) {
  return <div className="esqueleto" style={{ height: altura, width: largura }} />;
}
