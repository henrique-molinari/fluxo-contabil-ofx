// Express 4 não captura erros de funções async sozinho; este wrapper faz isso.
export const assincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
