// Valida body, query e params com schemas do zod. Se passar, troca pelo valor já convertido
// (ex.: "12" vira 12). Se falhar, responde 400 listando o que está errado.
import { ErroHttp } from "../errors.js";

export const validar = (schemas) => (req, res, next) => {
  for (const parte of ["params", "query", "body"]) {
    if (!schemas[parte]) continue;
    const r = schemas[parte].safeParse(req[parte] ?? {});
    if (!r.success) {
      const detalhes = r.error.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
      return next(new ErroHttp(400, "Dados inválidos.", detalhes));
    }
    // defineProperty porque req.query pode ser só leitura dependendo da versão do Express
    Object.defineProperty(req, parte, { value: r.data, writable: true, configurable: true });
  }
  next();
};
