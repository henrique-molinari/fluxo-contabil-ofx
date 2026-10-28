// Chamadas da API de comentários das contas.
// Cada função só monta a URL e o corpo; o token e os erros são tratados em shared/http.js.
import { chamar } from "../../shared/http.js";

export const comentariosApi = {
  listar: (movimentacaoId) => chamar(`/api/movimentacoes/${movimentacaoId}/comentarios`),
  criar: (movimentacaoId, texto) =>
    chamar(`/api/movimentacoes/${movimentacaoId}/comentarios`, { method: "POST", corpo: { texto } }),
  apagar: (id) => chamar(`/api/comentarios/${id}`, { method: "DELETE" }),
};
