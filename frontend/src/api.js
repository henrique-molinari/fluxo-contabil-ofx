// api.js
// Aqui ficam todas as funções que conversam com o backend em Python.
// Fiz isso num arquivo só pra não repetir fetch em todo componente.

// Função base: faz a chamada e já trata o erro pra mim
async function chamar(url, opcoes) {
  const resposta = await fetch(url, opcoes);
  const dados = await resposta.json();
  // Se o backend devolveu erro, eu "jogo" o erro pra tela mostrar
  if (!resposta.ok) throw new Error(dados.erro || "Erro inesperado");
  return dados;
}

// Monta o FormData com o arquivo (é assim que se envia upload)
function formularioComArquivo(arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return form;
}

export const api = {
  categorias: () => chamar("/api/categorias"),
  resumo: () => chamar("/api/resumo"),
  movimentacoes: () => chamar("/api/movimentacoes"),

  // Mostra o que seria importado, sem gravar
  preview: (arquivo) =>
    chamar("/api/preview", { method: "POST", body: formularioComArquivo(arquivo) }),

  // Grava de verdade no PostgreSQL
  importar: (arquivo) =>
    chamar("/api/importar", { method: "POST", body: formularioComArquivo(arquivo) }),

  // Muda a categoria de uma movimentação
  classificar: (id, categoria) =>
    chamar(`/api/movimentacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    }),

  classificarAutomatico: () =>
    chamar("/api/classificar-automatico", { method: "POST" }),

  apagarTudo: () => chamar("/api/movimentacoes", { method: "DELETE" }),
};

// Funções pra deixar número e data bonitos na tela
export const dinheiro = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso) => iso.split("-").reverse().join("/");
