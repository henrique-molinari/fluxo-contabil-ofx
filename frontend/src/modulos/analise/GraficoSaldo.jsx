// GraficoSaldo.jsx
// Evolução do saldo acumulado ao longo dos dias, em área (padrão) ou linha.
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DicaGrafico from "./DicaGrafico.jsx";
import { curto, eixo, nomeDia } from "./formatosGrafico.js";
import { VERDE, VERDE_LINHA } from "./tema.js";

export default function GraficoSaldo({ dados, tipo }) {
  const lista = dados.map((d) => ({ ...d, nome: nomeDia(d.dia) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      {tipo === "linha" ? (
        <LineChart data={lista} margin={{ left: -10, right: 10 }}>
          <CartesianGrid vertical={false} stroke="#e4eeeb" />
          <XAxis dataKey="nome" tick={eixo} axisLine={false} tickLine={false} />
          <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
          <Tooltip content={<DicaGrafico />} />
          <Line type="monotone" dataKey="saldo" name="Saldo" stroke={VERDE_LINHA} strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      ) : (
        <AreaChart data={lista} margin={{ left: -10, right: 10 }}>
          {/* degradê embaixo da linha */}
          <defs>
            <linearGradient id="degradeSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VERDE} stopOpacity={0.45} />
              <stop offset="100%" stopColor={VERDE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e4eeeb" />
          <XAxis dataKey="nome" tick={eixo} axisLine={false} tickLine={false} />
          <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
          <Tooltip content={<DicaGrafico />} />
          <Area type="monotone" dataKey="saldo" name="Saldo" stroke={VERDE_LINHA} strokeWidth={3} fill="url(#degradeSaldo)" />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
