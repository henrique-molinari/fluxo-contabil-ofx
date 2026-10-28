// Repositório da autenticação: acesso aos models Usuario (login/senha) e RefreshToken.
import { col, fn, where as comparar } from "sequelize";
import { RefreshToken, Usuario } from "../../shared/models/index.js";

export class AuthRepositorio {
  // Busca o usuário pelo e-mail, sem diferenciar maiúsculas de minúsculas
  async buscarUsuarioPorEmail(email) {
    return Usuario.findOne({
      where: comparar(fn("lower", col("email")), email.toLowerCase()),
      raw: true,
    });
  }

  // Busca o usuário pelo id (devolve um objeto simples, ou null se não existir)
  async buscarUsuarioPorId(id) {
    return Usuario.findByPk(id, { raw: true });
  }

  // Busca só os dados que o middleware "authenticate" coloca em req.usuario (sem senha_hash)
  async buscarUsuarioAutenticado(id) {
    return Usuario.findByPk(id, { attributes: ["id", "nome", "email", "perfil", "ativo"], raw: true });
  }

  // Guarda o hash de um refresh token novo (nunca o token em si)
  async salvarRefreshToken(usuarioId, tokenHash, expiraEm) {
    await RefreshToken.create({ usuario_id: usuarioId, token_hash: tokenHash, expira_em: expiraEm });
  }

  // Procura um refresh token pelo hash
  async buscarRefreshToken(tokenHash) {
    return RefreshToken.findOne({ where: { token_hash: tokenHash }, raw: true });
  }

  // Marca um refresh token (pelo id) como usado/revogado
  async revogarRefreshToken(id) {
    await RefreshToken.update({ revogado_em: new Date() }, { where: { id } });
  }

  // Revoga um refresh token pelo hash, se ainda estiver ativo (usado no logout)
  async revogarPorHash(tokenHash) {
    await RefreshToken.update({ revogado_em: new Date() }, { where: { token_hash: tokenHash, revogado_em: null } });
  }

  // Revoga todos os refresh tokens ativos de um usuário
  async revogarTodos(usuarioId) {
    await RefreshToken.update({ revogado_em: new Date() }, { where: { usuario_id: usuarioId, revogado_em: null } });
  }

  // Devolve o hash da senha atual do usuário
  async buscarSenhaHash(usuarioId) {
    const usuario = await Usuario.findByPk(usuarioId, { attributes: ["senha_hash"], raw: true });
    return usuario?.senha_hash;
  }

  // Troca o hash da senha; devolve quantas linhas foram alteradas (0 = usuário não existe)
  async atualizarSenha(usuarioId, senhaHash) {
    const [alteradas] = await Usuario.update({ senha_hash: senhaHash }, { where: { id: usuarioId } });
    return alteradas;
  }
}

// Instância única usada pelo restante da aplicação
export const authRepositorio = new AuthRepositorio();
