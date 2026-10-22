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
import { permissoesDoPerfil } from "../../config/permissoes.js";
import { consultar } from "../../compartilhado/db.js";
import { ErroHttp } from "../../compartilhado/erros.js";

// Hash falso usado quando o e-mail não existe, para o tempo de resposta
// ser parecido e não revelar quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync("senha-falsa-para-igualar-tempo", 10);

const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("hex");

// O que pode ir para o navegador: nunca inclui senha_hash
export function dadosPublicos(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    permissoes: permissoesDoPerfil(u.perfil),
  };
}

// JWT assinado com o segredo do servidor; carrega só o id (subject) e o perfil
function gerarAccessToken(usuario) {
  return jwt.sign({ perfil: usuario.perfil }, env.jwt.segredo, {
    subject: String(usuario.id),
    expiresIn: env.jwt.expiraEm,
    algorithm: "HS256",
  });
}

// Token aleatório entregue ao cliente; no banco vai somente o hash SHA-256 dele
async function gerarRefreshToken(usuarioId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiraEm = new Date(Date.now() + env.jwt.refreshDias * 24 * 60 * 60 * 1000);
  await consultar(
    "INSERT INTO refresh_tokens (usuario_id, token_hash, expira_em) VALUES ($1, $2, $3)",
    [usuarioId, sha256(token), expiraEm]
  );
  return token;
}

// Monta a resposta completa de login/renovação
async function emitirTokens(usuario) {
  return {
    accessToken: gerarAccessToken(usuario),
    refreshToken: await gerarRefreshToken(usuario.id),
    tipo: "Bearer",
    expiraEm: env.jwt.expiraEm,
    usuario: dadosPublicos(usuario),
  };
}

// Confere e-mail e senha. O bcrypt.compare roda sempre, exista o usuário ou não.
export async function login(email, senha) {
  const { rows } = await consultar("SELECT * FROM usuarios WHERE lower(email) = lower($1)", [email]);
  const usuario = rows[0];
  const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);

  // Mesma mensagem para e-mail inexistente e senha errada (não entrega pista)
  if (!usuario || !senhaConfere) throw new ErroHttp(401, "E-mail ou senha inválidos.");
  if (!usuario.ativo) throw new ErroHttp(403, "Usuário desativado. Fale com o gestor.");

  return emitirTokens(usuario);
}

// Troca um refresh token válido por um par novo (rotação de tokens)
export async function renovar(refreshToken) {
  const { rows } = await consultar("SELECT * FROM refresh_tokens WHERE token_hash = $1", [sha256(refreshToken)]);
  const registro = rows[0];
  if (!registro) throw new ErroHttp(401, "Refresh token inválido.");

  // Token já usado/revogado sendo apresentado de novo = possível roubo: derruba tudo.
  if (registro.revogado_em) {
    await revogarTodos(registro.usuario_id);
    throw new ErroHttp(401, "Refresh token já utilizado. Faça login novamente.");
  }
  if (new Date(registro.expira_em) < new Date()) throw new ErroHttp(401, "Refresh token expirado.");

  const { rows: us } = await consultar("SELECT * FROM usuarios WHERE id = $1", [registro.usuario_id]);
  const usuario = us[0];
  if (!usuario || !usuario.ativo) throw new ErroHttp(401, "Usuário inativo ou inexistente.");

  await consultar("UPDATE refresh_tokens SET revogado_em = now() WHERE id = $1", [registro.id]);
  return emitirTokens(usuario);
}

// Invalida o refresh token informado (o accessToken simplesmente expira sozinho)
export async function logout(refreshToken) {
  await consultar(
    "UPDATE refresh_tokens SET revogado_em = now() WHERE token_hash = $1 AND revogado_em IS NULL",
    [sha256(refreshToken)]
  );
}

// Encerra todas as sessões de um usuário (troca de senha, desativação ou suspeita de roubo)
export async function revogarTodos(usuarioId) {
  await consultar(
    "UPDATE refresh_tokens SET revogado_em = now() WHERE usuario_id = $1 AND revogado_em IS NULL",
    [usuarioId]
  );
}

// Exige a senha atual antes de trocar
export async function trocarSenha(usuarioId, senhaAtual, senhaNova) {
  const { rows } = await consultar("SELECT senha_hash FROM usuarios WHERE id = $1", [usuarioId]);
  if (!(await bcrypt.compare(senhaAtual, rows[0].senha_hash))) {
    throw new ErroHttp(400, "A senha atual está incorreta.");
  }
  await consultar("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [await bcrypt.hash(senhaNova, 10), usuarioId]);
  await revogarTodos(usuarioId); // força login de novo nos outros aparelhos
}
