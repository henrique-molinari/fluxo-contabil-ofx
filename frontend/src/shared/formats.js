// Funções para deixar número e data bonitos na tela
// 1234.5 -> "R$ 1.234,50"
export const dinheiro = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "2026-10-17" -> "17/10/2026" (aceita também datas com hora)
export const dataBR = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");

// Data e hora no padrão brasileiro curto
export const dataHoraBR = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

// Nome amigável de cada perfil para mostrar na tela
export const NOME_PERFIL = { ANALISTA: "Analista fiscal", ESTAGIARIO: "Estagiário", GESTOR: "Gestor" };
