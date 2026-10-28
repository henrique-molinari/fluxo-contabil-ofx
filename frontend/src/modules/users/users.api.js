// Chamadas da API de gestão de usuários (só o gestor usa).
// Cada função só monta a URL e o corpo; o token e os erros são tratados em shared/http.js.
import { chamar } from "../../shared/http.js";

export const usuariosApi = {
  listar: () => chamar("/api/usuarios"),
  criar: (dados) => chamar("/api/usuarios", { method: "POST", corpo: dados }),
  atualizar: (id, dados) => chamar(`/api/usuarios/${id}`, { method: "PATCH", corpo: dados }),
  redefinirSenha: (id, senhaNova) =>
    chamar(`/api/usuarios/${id}/redefinir-senha`, { method: "POST", corpo: { senhaNova } }),
};
