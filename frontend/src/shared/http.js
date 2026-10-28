// http.js
// Base de todas as chamadas à API: coloca o token no cabeçalho, renova o token quando
// ele expira (401) e trata os erros. Cada módulo tem seu próprio arquivo .api.js
// que usa as funções daqui.

const CHAVE = "ofx-sessao";

// ----- sessão (tokens ficam no navegador) -----
export const sessao = {
  ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || null;
    } catch {
      return null;
    }
  },
  salvar(dados) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
    } catch { /* navegador bloqueou o armazenamento */ }
  },
  limpar() {
    try {
      localStorage.removeItem(CHAVE);
    } catch { /* idem */ }
  },
};

// Quando a sessão acaba de vez, o AuthContext é avisado por aqui
let aoExpirar = () => {};
export const definirAoExpirar = (fn) => { aoExpirar = fn; };

// ----- renovação do token -----
let renovando = null; // se várias chamadas falharem juntas, renova uma vez só

// Usa o refreshToken para pegar um accessToken novo e salvar a sessão atualizada
async function renovarToken() {
  const atual = sessao.ler();
  if (!atual?.refreshToken) throw new Error("sem sessão");
  renovando ??= fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: atual.refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) throw new Error("sessão expirada");
      sessao.salvar(await r.json());
    })
    .finally(() => { renovando = null; });
  return renovando;
}

// fetch com o token no cabeçalho. Se der 401, renova o token e tenta de novo (uma vez só).
async function requisitar(url, opcoes = {}, tentarRenovar = true) {
  const headers = { ...opcoes.headers };
  const token = sessao.ler()?.accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(url, { ...opcoes, headers });

  // Token expirado: renova e repete a chamada uma vez
  if (resposta.status === 401 && tentarRenovar && token && !url.startsWith("/api/auth/")) {
    try {
      await renovarToken();
    } catch {
      sessao.limpar();
      aoExpirar();
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    return requisitar(url, opcoes, false);
  }
  return resposta;
}

// Extrai a mensagem de erro { erro: "..." } que a API devolve
async function lerErro(resposta) {
  try {
    const dados = await resposta.json();
    return dados.erro || "Erro inesperado";
  } catch {
    return "Erro inesperado";
  }
}

// JSON -> JSON. Se a API devolveu erro, joga o erro para a tela mostrar.
export async function chamar(url, { corpo, ...opcoes } = {}) {
  const init = { ...opcoes };
  if (corpo instanceof FormData) {
    init.body = corpo;
  } else if (corpo !== undefined) {
    init.body = JSON.stringify(corpo);
    init.headers = { ...init.headers, "Content-Type": "application/json" };
  }
  const resposta = await requisitar(url, init);
  if (!resposta.ok) throw new Error(await lerErro(resposta));
  return resposta.status === 204 ? null : resposta.json();
}

// Baixa um arquivo (exportações) mandando o token junto
export async function baixar(url, nomeArquivo) {
  const resposta = await requisitar(url);
  if (!resposta.ok) throw new Error(await lerErro(resposta));
  const blob = await resposta.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(link.href);
}
