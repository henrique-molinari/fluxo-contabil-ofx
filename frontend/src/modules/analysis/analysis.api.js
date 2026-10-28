// Chamadas da API do painel de análise.
// Cada função só monta a URL e o corpo; o token e os erros são tratados em shared/http.js.
import { chamar } from "../../shared/http.js";

export const analiseApi = {
  resumo: () => chamar("/api/analise/resumo"),
};
