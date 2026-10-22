// Chamadas da API de tratamento: listar, lançar, classificar e apagar contas.
// Cada função só monta a URL e o corpo; o token e os erros são tratados em compartilhado/http.js.
import { chamar } from "../../compartilhado/http.js";

export const tratamentoApi = {
  categorias: () => chamar("/api/categorias"),
  movimentacoes: () => chamar("/api/movimentacoes"),
  criar: (dados) => chamar("/api/movimentacoes", { method: "POST", corpo: dados }),
  classificar: (id, categoria) =>
    chamar(`/api/movimentacoes/${id}`, { method: "PATCH", corpo: { categoria } }),
  classificarAutomatico: () => chamar("/api/movimentacoes/classificar-automatico", { method: "POST" }),
  apagarTudo: () => chamar("/api/movimentacoes", { method: "DELETE" }),
};
