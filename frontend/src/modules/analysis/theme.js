// theme.js
// Cores do sistema num lugar só, pra eu usar nos gráficos.
// Continuei com a base verde do site de referência (#00E394 e #004C66),
// mas escureci alguns tons pra ficar mais sofisticado e fácil de ler.

export const VERDE = "#00c985";        // verde vivo (entradas)
export const PETROLEO = "#0b3d44";     // verde-petróleo bem escuro (saídas)
export const VERDE_LINHA = "#00795f";  // verde das linhas e botões

// Cores das categorias nos gráficos (família verde, do escuro pro claro).
// A última (cinza) fica reservada pra "Sem categoria".
export const CORES_GRAFICO = [
  "#0b3d44", "#00795f", "#00c985", "#2a9d8f", "#6fdcb9",
  "#14575c", "#4fb99f", "#a5ebd2", "#3b7f74",
];
export const COR_SEM_CATEGORIA = "#b4c2be";

// Devolve a cor de uma categoria. "Sem categoria" sempre fica cinza.
export function corDaCategoria(nome, indice) {
  if (nome === "Sem categoria") return COR_SEM_CATEGORIA;
  return CORES_GRAFICO[indice % CORES_GRAFICO.length];
}
