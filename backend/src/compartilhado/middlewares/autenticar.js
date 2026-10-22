// AUTENTICAÇÃO: descobre QUEM está chamando a API.
// Lê o "Authorization: Bearer <token>", valida o JWT e carrega o usuário do banco.
// Falhou aqui = 401 (não identificado). Quem decide se pode ou não é o autorizar.js (403).
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { consultar } from "../db.js";
import { ErroHttp } from "../erros.js";
import { assincrono } from "../asyncHandler.js";

export const autenticar = assincrono(async (req, res, next) => {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");
  if (tipo !== "Bearer" || !token) throw new ErroHttp(401, "Faça login para continuar.");

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.segredo, { algorithms: ["HS256"] });
  } catch (e) {
    const expirado = e.name === "TokenExpiredError";
    throw new ErroHttp(401, expirado ? "Sessão expirada. Renove o token." : "Token inválido.");
  }

  // Busca no banco a cada chamada: se o usuário foi desativado ou mudou de perfil,
  // vale na hora (sem esperar o token expirar).
  const { rows } = await consultar(
    "SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = $1",
    [payload.sub]
  );
  const usuario = rows[0];
  if (!usuario || !usuario.ativo) throw new ErroHttp(401, "Usuário inativo ou inexistente.");

  req.usuario = usuario;
  next();
});
