// Modal.jsx
// Janela lateral por cima da tela, com fundo escurecido. Clicar fora ou no X fecha.
//   <Modal titulo="Comentários" subtitulo="Aluguel" aoFechar={fechar}>...</Modal>
import { X } from "lucide-react";

export default function Modal({ titulo, subtitulo, aoFechar, children }) {
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      {/* stopPropagation: clicar dentro da janela não deve fechá-la */}
      <aside className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={titulo}>
        <header>
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="icone-botao" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>
        {children}
      </aside>
    </div>
  );
}
