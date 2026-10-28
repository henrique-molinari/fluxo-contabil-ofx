// chartFormats.js
// Pequenas funções e estilos que os gráficos compartilham (eixos, nomes de mês e dia, valores curtos).

// Estilo comum dos eixos (cinza claro e fonte pequena, pra não chamar atenção)
export const eixo = { fontSize: 12, fill: "#6b7f7b" };

// Transforma "2026-10" em "out/26" (mais bonito no eixo)
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const nomeMes = (ym) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;

// Transforma "2026-10-05" em "05/10"
export const nomeDia = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Valores grandes no eixo ficam curtos: 12000 vira "12k"
export const curto = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);
