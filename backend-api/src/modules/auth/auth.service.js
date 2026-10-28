// Regras de AUTENTICAÇÃO: login, renovação de token, logout e troca de senha.
//
// Dois tokens:
//  - accessToken (JWT, curto, 15 min): vai em todas as chamadas no header Authorization.
//  - refreshToken (aleatório, 7 dias): só serve para pedir um accessToken novo.
//    No banco guardamos apenas o hash dele. A cada uso ele é trocado por outro (rotação);
//    se alguém reutilizar um token já trocado, derrubamos todas as sessões do usuário.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { permissoesDoPerfil } from "../../config/permissions.js";
import { ErroHttp } from "../../shared/errors.js";
import { authRepositorio } from "./auth.repository.js";

// Hash falso usado quando o e-mail não existe, para o tempo de resposta
// ser parecido e não revelar quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync("senha-falsa-para-igualar-tempo", 10);

const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("hex");

export class AuthServico {
  constructor(repositorio = authRepositorio) {
    this.repositorio = repositorio;
  }

  // O que pode ir para o navegador: nunca inclui senha_hash
  dadosPublicos(u) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      permissoes: permissoesDoPerfil(u.perfil),
    };
  }

  // JWT assinado com o segredo do servidor; carrega só o id (subject) e o perfil
  gerarAccessToken(usuario) {
    return jwt.sign({ perfil: usuario.perfil }, env.jwt.segredo, {
      subject: String(usuario.id),
      expiresIn: env.jwt.expiraEm,
      algorithm: "HS256",
    });
  }

  // Token aleatório entregue ao cliente; no banco vai somente o hash SHA-256 dele
  async gerarRefreshToken(usuarioId) {
    const token = crypto.randomBytes(48).toString("hex");
    const expiraEm = new Date(Date.now() + env.jwt.refreshDias * 24 * 60 * 60 * 1000);
    await this.repositorio.salvarRefreshToken(usuarioId, sha256(token), expiraEm);
    return token;
  }

  // Monta a resposta completa de login/renovação
  async emitirTokens(usuario) {
    return {
      accessToken: this.gerarAccessToken(usuario),
      refreshToken: await this.gerarRefreshToken(usuario.id),
      tipo: "Bearer",
      expiraEm: env.jwt.expiraEm,
      usuario: this.dadosPublicos(usuario),
    };
  }

  // Confere e-mail e senha. O bcrypt.compare roda sempre, exista o usuário ou não.
  async login(email, senha) {
    const usuario = await this.repositorio.buscarUsuarioPorEmail(email);
    const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);

    // Mesma mensagem para e-mail inexistente e senha errada (não entrega pista)
    if (!usuario || !senhaConfere) throw new ErroHttp(401, "E-mail ou senha inválidos.");
    if (!usuario.ativo) throw new ErroHttp(403, "Usuário desativado. Fale com o gestor.");

    return this.emitirTokens(usuario);
  }

  // Troca um refresh token válido por um par novo (rotação de tokens)
  async renovar(refreshToken) {
    const registro = await this.repositorio.buscarRefreshToken(sha256(refreshToken));
    if (!registro) throw new ErroHttp(401, "Refresh token inválido.");

    // Token já usado/revogado sendo apresentado de novo = possível roubo: derruba tudo.
    if (registro.revogado_em) {
      await this.revogarTodos(registro.usuario_id);
      throw new ErroHttp(401, "Refresh token já utilizado. Faça login novamente.");
    }
    if (new Date(registro.expira_em) < new Date()) throw new ErroHttp(401, "Refresh token expirado.");

    const usuario = await this.repositorio.buscarUsuarioPorId(registro.usuario_id);
    if (!usuario || !usuario.ativo) throw new ErroHttp(401, "Usuário inativo ou inexistente.");

    await this.repositorio.revogarRefreshToken(registro.id);
    return this.emitirTokens(usuario);
  }

  // Invalida o refresh token informado (o accessToken simplesmente expira sozinho)
  async logout(refreshToken) {
    await this.repositorio.revogarPorHash(sha256(refreshToken));
  }

  // Encerra todas as sessões de um usuário (troca de senha, desativação ou suspeita de roubo)
  async revogarTodos(usuarioId) {
    await this.repositorio.revogarTodos(usuarioId);
  }

  // Exige a senha atual antes de trocar
  async trocarSenha(usuarioId, senhaAtual, senhaNova) {
    const hashAtual = await this.repositorio.buscarSenhaHash(usuarioId);
    if (!(await bcrypt.compare(senhaAtual, hashAtual))) {
      throw new ErroHttp(400, "A senha atual está incorreta.");
    }
    await this.repositorio.atualizarSenha(usuarioId, await bcrypt.hash(senhaNova, 10));
    await this.revogarTodos(usuarioId); // força login de novo nos outros aparelhos
  }
}

// Instância única usada pelas rotas e por outros módulos (ex.: usuários)
export const authServico = new AuthServico();
