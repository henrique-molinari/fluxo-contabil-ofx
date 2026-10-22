// Chamadas da API do painel de análise.
// Cada função só monta a URL e o corpo; o token e os erros são tratados em compartilhado/http.js.
import { chamar } from "../../compartilhado/http.js";

export const analiseApi = {
  resumo: () => chamar("/api/analise/resumo"),
};
