// Chamadas da API de exportação (baixa o arquivo no formato escolhido).
// Cada função só monta a URL e o corpo; o token e os erros são tratados em compartilhado/http.js.
import { baixar } from "../../compartilhado/http.js";

export const exportacaoApi = {
  baixar: (formato) => baixar(`/api/exportacao/${formato}`, `movimentacoes.${formato}`),
};
