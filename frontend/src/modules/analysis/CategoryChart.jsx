// CategoryChart.jsx
// Gastos por categoria. O "tipo" escolhido pelo usuário define o desenho:
// rosca, pizza, barras verticais (colunas) ou barras horizontais.
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dinheiro } from "../../shared/formats.js";
import DicaGrafico from "./ChartTooltip.jsx";
import { curto, eixo } from "./chartFormats.js";
import { corDaCategoria } from "./theme.js";

export default function GraficoCategorias({ dados, tipo }) {
  // Coloco a cor de cada categoria dentro dos dados
  const lista = dados.map((d, i) => ({ ...d, cor: corDaCategoria(d.categoria, i) }));
  const total = lista.reduce((soma, d) => soma + d.total, 0);

  // Pizza e rosca: gráfico circular com a legenda ao lado
  if (tipo === "rosca" || tipo === "pizza") {
    return (
      <div className="circular">
        <div className="circular-grafico">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={lista}
                dataKey="total"
                nameKey="categoria"
                innerRadius={tipo === "rosca" ? 70 : 0}
                outerRadius={110}
                paddingAngle={tipo === "rosca" ? 2 : 0}
                stroke="#fff"
                strokeWidth={2}
              >
                {lista.map((d) => <Cell key={d.categoria} fill={d.cor} />)}
              </Pie>
              <Tooltip content={<DicaGrafico />} />
            </PieChart>
          </ResponsiveContainer>
          {/* No meio da rosca eu escrevo o total */}
          {tipo === "rosca" && (
            <div className="centro-rosca">
              <small>Total gasto</small>
              <b>{dinheiro(total)}</b>
            </div>
          )}
        </div>

        {/* Legenda feita à mão: bolinha, nome, valor e percentual */}
        <ul className="legenda">
          {lista.map((d) => (
            <li key={d.categoria}>
              <i style={{ background: d.cor }} />
              <span>{d.categoria}</span>
              <b>{((d.total / total) * 100).toFixed(0)}%</b>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Barras horizontais: ótimo quando o nome da categoria é grande
  if (tipo === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(260, lista.length * 42)}>
        <BarChart data={lista} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid horizontal={false} stroke="#e4eeeb" />
          <XAxis type="number" tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="categoria" width={140} tick={eixo} axisLine={false} tickLine={false} />
          <Tooltip content={<DicaGrafico />} cursor={{ fill: "#eef5f3" }} />
          <Bar dataKey="total" name="Gasto" radius={[0, 6, 6, 0]} barSize={20}>
            {lista.map((d) => <Cell key={d.categoria} fill={d.cor} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Barras verticais (padrão)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={lista} margin={{ left: -10, right: 10 }}>
        <CartesianGrid vertical={false} stroke="#e4eeeb" />
        <XAxis dataKey="categoria" tick={eixo} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
        <Tooltip content={<DicaGrafico />} cursor={{ fill: "#eef5f3" }} />
        <Bar dataKey="total" name="Gasto" radius={[6, 6, 0, 0]}>
          {lista.map((d) => <Cell key={d.categoria} fill={d.cor} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
