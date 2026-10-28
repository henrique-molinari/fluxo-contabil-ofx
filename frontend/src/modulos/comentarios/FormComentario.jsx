// FormComentario.jsx
// Caixa de texto para escrever um comentário novo. Só aparece para quem pode comentar (analista).
import { useState } from "react";
import { Send } from "lucide-react";
import Botao from "../../compartilhado/Botao.jsx";

// aoEnviar(texto) deve devolver uma Promise; se ela der certo, a caixa é limpa
export default function FormComentario({ aoEnviar }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await aoEnviar(texto);
      setTexto("");
    } catch {
      /* a tela de cima já mostra o erro; o texto fica na caixa para tentar de novo */
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} className="comentario-form">
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} rows={3}
        placeholder="Escreva uma observação sobre esta conta..." />
      <Botao carregando={enviando} disabled={!texto.trim()} icone={Send}>Comentar</Botao>
    </form>
  );
}
