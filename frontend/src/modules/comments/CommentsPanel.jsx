// CommentsPanel.jsx
// Janela com os comentários de uma conta. Quem tem "comentarios:criar" (analista) escreve;
// quem só tem "comentarios:ler" (gestor) apenas lê.
import { useState } from "react";
import Alerta from "../../shared/Alert.jsx";
import { Carregando } from "../../shared/Loading.jsx";
import Modal from "../../shared/Modal.jsx";
import { useRequisicao } from "../../shared/useRequest.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { comentariosApi } from "./comments.api.js";
import FormComentario from "./CommentForm.jsx";
import ItemComentario from "./CommentItem.jsx";

export default function PainelComentarios({ movimentacao, aoFechar, aoMudarQuantidade }) {
  const { usuario, pode } = useAuth();
  const [erroAcao, setErroAcao] = useState(""); // erro ao comentar ou apagar

  // Carrega os comentários sempre que troca a conta selecionada
  const { dados, setDados, erro, carregando } = useRequisicao(
    () => comentariosApi.listar(movimentacao.id),
    [movimentacao.id]
  );

  // Envia o comentário e avisa a tabela para somar 1 no contador
  async function enviar(texto) {
    setErroAcao("");
    try {
      const novo = await comentariosApi.criar(movimentacao.id, texto);
      setDados((l) => [...l, novo]);
      aoMudarQuantidade(movimentacao.id, 1);
    } catch (err) {
      setErroAcao(err.message);
      throw err; // o formulário mantém o texto digitado
    }
  }

  // Apaga (a API só deixa o próprio autor apagar) e desconta 1 do contador
  async function apagar(id) {
    setErroAcao("");
    try {
      await comentariosApi.apagar(id);
      setDados((l) => l.filter((c) => c.id !== id));
      aoMudarQuantidade(movimentacao.id, -1);
    } catch (err) {
      setErroAcao(err.message);
    }
  }

  return (
    <Modal titulo="Comentários" subtitulo={movimentacao.descricao} aoFechar={aoFechar}>
      <Alerta tipo="erro">{erro || erroAcao}</Alerta>

      <div className="comentarios-lista">
        {carregando && <Carregando texto="Carregando..." />}
        {dados?.length === 0 && <p className="mudo">Nenhum comentário ainda.</p>}
        {dados?.map((c) => (
          <ItemComentario key={c.id} comentario={c} ehAutor={c.autor_id === usuario.id} aoApagar={apagar} />
        ))}
      </div>

      {pode("comentarios:criar") && <FormComentario aoEnviar={enviar} />}
    </Modal>
  );
}
