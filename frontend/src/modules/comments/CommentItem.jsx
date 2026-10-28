// CommentItem.jsx
// Um comentário da lista: autor, data/hora, texto e (só para o próprio autor) o botão de apagar.
import { Trash2 } from "lucide-react";
import { dataHoraBR } from "../../shared/formats.js";

export default function ItemComentario({ comentario, ehAutor, aoApagar }) {
  return (
    <div className="comentario">
      <div className="comentario-topo">
        <b>{comentario.autor}</b>
        <span className="mudo">{dataHoraBR(comentario.criado_em)}</span>
        {ehAutor && (
          <button className="icone-botao" onClick={() => aoApagar(comentario.id)} aria-label="Apagar comentário">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p>{comentario.texto}</p>
    </div>
  );
}
