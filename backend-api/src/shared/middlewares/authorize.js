// AUTORIZAÇÃO: descobre se quem chamou PODE fazer isso.
// Deve vir depois do autenticar. Sem permissão = 403.
// Uso:  router.get("/x", autenticar, autorizar("analise:ler"), handler)
import { temPermissao } from "../../config/permissions.js";
import { ErroHttp } from "../errors.js";

export const autorizar = (...permissoes) => (req, res, next) => {
  if (!req.usuario) return next(new ErroHttp(401, "Faça login para continuar."));
  // Exige TODAS as permissões listadas
  const permitido = permissoes.every((p) => temPermissao(req.usuario.perfil, p));
  if (!permitido) {
    return next(new ErroHttp(403, "Seu perfil não tem permissão para esta ação."));
  }
  next();
};
