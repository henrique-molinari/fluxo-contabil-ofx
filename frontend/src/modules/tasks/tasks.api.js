// Chamadas da API de tarefas delegadas.
// Cada função só monta a URL e o corpo; o token e os erros são tratados em shared/http.js.
import { chamar } from "../../shared/http.js";

export const tarefasApi = {
  listar: () => chamar("/api/tarefas"),
  criar: (dados) => chamar("/api/tarefas", { method: "POST", corpo: dados }),
  mudarStatus: (id, status) => chamar(`/api/tarefas/${id}/status`, { method: "PATCH", corpo: { status } }),
  excluir: (id) => chamar(`/api/tarefas/${id}`, { method: "DELETE" }),
};
