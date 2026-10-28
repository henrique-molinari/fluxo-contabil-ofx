// MonthlyChart.jsx
// Entradas x saídas de cada mês, em barras, linhas ou área conforme o "tipo" escolhido.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DicaGrafico from "./ChartTooltip.jsx";
import { curto, eixo, nomeMes } from "./chartFormats.js";
import { PETROLEO, VERDE } from "./theme.js";

export default function GraficoMensal({ dados, tipo }) {
  const lista = dados.map((d) => ({ ...d, nome: nomeMes(d.mes) }));

  // Partes que se repetem nos três tipos eu junto numa variável
  const comum = (
    <>
      <CartesianGrid vertical={false} stroke="#e4eeeb" />
      <XAxis dataKey="nome" tick={eixo} axisLine={false} tickLine={false} />
      <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
      <Tooltip content={<DicaGrafico />} cursor={{ fill: "#eef5f3" }} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      {tipo === "linha" ? (
        <LineChart data={lista} margin={{ left: -10, right: 10 }}>
          {comum}
          <Line type="monotone" dataKey="entradas" name="Entradas" stroke={VERDE} strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="saidas" name="Saídas" stroke={PETROLEO} strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      ) : tipo === "area" ? (
        <AreaChart data={lista} margin={{ left: -10, right: 10 }}>
          {comum}
          <Area type="monotone" dataKey="entradas" name="Entradas" stroke={VERDE} strokeWidth={2} fill={VERDE} fillOpacity={0.25} />
          <Area type="monotone" dataKey="saidas" name="Saídas" stroke={PETROLEO} strokeWidth={2} fill={PETROLEO} fillOpacity={0.2} />
        </AreaChart>
      ) : (
        <BarChart data={lista} margin={{ left: -10, right: 10 }}>
          {comum}
          <Bar dataKey="entradas" name="Entradas" fill={VERDE} radius={[6, 6, 0, 0]} />
          <Bar dataKey="saidas" name="Saídas" fill={PETROLEO} radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
