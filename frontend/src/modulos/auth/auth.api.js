// Chamadas da API de autenticação (login, logout, dados do usuário, troca de senha).
// Cada função só monta a URL e o corpo; o token e os erros são tratados em compartilhado/http.js.
import { chamar } from "../../compartilhado/http.js";

export const authApi = {
  login: (email, senha) => chamar("/api/auth/login", { method: "POST", corpo: { email, senha } }),
  logout: (refreshToken) => chamar("/api/auth/logout", { method: "POST", corpo: { refreshToken } }),
  eu: () => chamar("/api/auth/eu"),
  trocarSenha: (senhaAtual, senhaNova) =>
    chamar("/api/auth/trocar-senha", { method: "POST", corpo: { senhaAtual, senhaNova } }),
};
