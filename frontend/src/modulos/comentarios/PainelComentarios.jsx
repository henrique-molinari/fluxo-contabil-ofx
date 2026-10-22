// PainelComentarios.jsx
// Janela com os comentários de uma conta. Quem tem "comentarios:criar" (analista) escreve;
// quem só tem "comentarios:ler" (gestor) apenas lê.
import { useEffect, useState } from "react";
import { Send, Trash2, X } from "lucide-react";
import { dataHoraBR } from "../../compartilhado/formatos.js";
import { Carregando, MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { comentariosApi } from "./comentarios.api.js";

// Janela lateral com os comentários de uma conta
export default function PainelComentarios({ movimentacao, aoFechar, aoMudarQuantidade }) {
  const { usuario, pode } = useAuth();
  const [lista, setLista] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Carrega os comentários sempre que troca a conta selecionada
  useEffect(() => {
    comentariosApi.listar(movimentacao.id).then(setLista).catch((e) => { setLista([]); setErro(e.message); });
  }, [movimentacao.id]);

  // Envia o comentário e avisa a tabela para somar 1 no contador
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro("");
    try {
      const novo = await comentariosApi.criar(movimentacao.id, texto);
      setLista((l) => [...l, novo]);
      aoMudarQuantidade(movimentacao.id, 1);
      setTexto("");
    } catch (err) {
      setErro(err.message);
    }
    setEnviando(false);
  }

  // Apaga (a API só deixa o próprio autor apagar) e desconta 1 do contador
  async function apagar(id) {
    try {
      await comentariosApi.apagar(id);
      setLista((l) => l.filter((c) => c.id !== id));
      aoMudarQuantidade(movimentacao.id, -1);
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <aside className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Comentários">
        <header>
          <div>
            <h2>Comentários</h2>
            <p>{movimentacao.descricao}</p>
          </div>
          <button className="icone-botao" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        {erro && <div className="alerta erro">{erro}</div>}

        <div className="comentarios-lista">
          {lista === null && <Carregando texto="Carregando..." />}
          {lista?.length === 0 && <p className="mudo">Nenhum comentário ainda.</p>}
          {lista?.map((c) => (
            <div className="comentario" key={c.id}>
              <div className="comentario-topo">
                <b>{c.autor}</b>
                <span className="mudo">{dataHoraBR(c.criado_em)}</span>
                {c.autor_id === usuario.id && (
                  <button className="icone-botao" onClick={() => apagar(c.id)} aria-label="Apagar comentário">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>

        {pode("comentarios:criar") && (
          <form onSubmit={enviar} className="comentario-form">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} rows={3}
              placeholder="Escreva uma observação sobre esta conta..." />
            <button className="botao" disabled={enviando || !texto.trim()}>
              {enviando ? <MiniSpinner /> : <Send size={16} />} Comentar
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
