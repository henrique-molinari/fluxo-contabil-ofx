// Repositório da autenticação: SQL das tabelas "usuarios" (login/senha) e "refresh_tokens".
import { consultar } from "../../shared/db.js";

export class AuthRepositorio {
  // Busca o usuário pelo e-mail, sem diferenciar maiúsculas de minúsculas
  async buscarUsuarioPorEmail(email) {
    const { rows } = await consultar("SELECT * FROM usuarios WHERE lower(email) = lower($1)", [email]);
    return rows[0];
  }

  // Busca o usuário pelo id
  async buscarUsuarioPorId(id) {
    const { rows } = await consultar("SELECT * FROM usuarios WHERE id = $1", [id]);
    return rows[0];
  }

  // Busca só os dados que o middleware "autenticar" coloca em req.usuario (sem senha_hash)
  async buscarUsuarioAutenticado(id) {
    const { rows } = await consultar("SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = $1", [id]);
    return rows[0];
  }

  // Guarda o hash de um refresh token novo (nunca o token em si)
  async salvarRefreshToken(usuarioId, tokenHash, expiraEm) {
    await consultar(
      "INSERT INTO refresh_tokens (usuario_id, token_hash, expira_em) VALUES ($1, $2, $3)",
      [usuarioId, tokenHash, expiraEm]
    );
  }

  // Procura um refresh token pelo hash
  async buscarRefreshToken(tokenHash) {
    const { rows } = await consultar("SELECT * FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    return rows[0];
  }

  // Marca um refresh token (pelo id) como usado/revogado
  async revogarRefreshToken(id) {
    await consultar("UPDATE refresh_tokens SET revogado_em = now() WHERE id = $1", [id]);
  }

  // Revoga um refresh token pelo hash, se ainda estiver ativo (usado no logout)
  async revogarPorHash(tokenHash) {
    await consultar(
      "UPDATE refresh_tokens SET revogado_em = now() WHERE token_hash = $1 AND revogado_em IS NULL",
      [tokenHash]
    );
  }

  // Revoga todos os refresh tokens ativos de um usuário
  async revogarTodos(usuarioId) {
    await consultar(
      "UPDATE refresh_tokens SET revogado_em = now() WHERE usuario_id = $1 AND revogado_em IS NULL",
      [usuarioId]
    );
  }

  // Devolve o hash da senha atual do usuário
  async buscarSenhaHash(usuarioId) {
    const { rows } = await consultar("SELECT senha_hash FROM usuarios WHERE id = $1", [usuarioId]);
    return rows[0]?.senha_hash;
  }

  // Troca o hash da senha; devolve quantas linhas foram alteradas (0 = usuário não existe)
  async atualizarSenha(usuarioId, senhaHash) {
    const { rowCount } = await consultar("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [senhaHash, usuarioId]);
    return rowCount;
  }
}

// Instância única usada pelo restante da aplicação
export const authRepositorio = new AuthRepositorio();
