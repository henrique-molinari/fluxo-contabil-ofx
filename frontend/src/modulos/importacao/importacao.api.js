// Chamadas da API de importação de extratos OFX (prévia e importação de verdade).
// Cada função só monta a URL e o corpo; o token e os erros são tratados em compartilhado/http.js.
import { chamar } from "../../compartilhado/http.js";

// Monta o FormData com o arquivo (é assim que se envia upload)
function formulario(arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return form;
}

export const importacaoApi = {
  // Mostra o que seria importado, sem gravar
  preview: (arquivo) => chamar("/api/importacao/preview", { method: "POST", corpo: formulario(arquivo) }),
  // Grava de verdade no PostgreSQL
  importar: (arquivo) => chamar("/api/importacao", { method: "POST", corpo: formulario(arquivo) }),
};
