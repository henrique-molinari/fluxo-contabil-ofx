// Graficos.jsx
// Aqui estão os 3 gráficos do painel de análise. Cada um recebe o "tipo"
// escolhido pelo usuário e desenha o gráfico certo.
//  - GraficoCategorias: rosca, pizza, barras ou barras horizontais
//  - GraficoMensal: barras, linha ou área
//  - GraficoSaldo: área ou linha
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { dinheiro } from "../../compartilhado/formatos.js";
import { PETROLEO, VERDE, VERDE_LINHA, corDaCategoria } from "./tema.js";

// Estilo comum dos eixos (cinza claro e fonte pequena, pra não chamar atenção)
const eixo = { fontSize: 12, fill: "#6b7f7b" };

// Caixinha que aparece quando passo o mouse no gráfico
function Dica({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dica">
      {label && <div className="dica-titulo">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey + p.name} className="dica-linha">
          <i style={{ background: p.color || p.payload?.cor }} />
          {p.name}: <b>{dinheiro(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

// Transforma "2026-10" em "out/26" (mais bonito no eixo)
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const nomeMes = (ym) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;
// Transforma "2026-10-05" em "05/10"
const nomeDia = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Valores grandes no eixo ficam curtos: 12000 vira "12k"
const curto = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);

// ---------------------------------------------------------------------------
// Gastos por categoria: pizza, rosca ou barras, conforme o tipo escolhido
export function GraficoCategorias({ dados, tipo }) {
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
              <Tooltip content={<Dica />} />
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
          <Tooltip content={<Dica />} cursor={{ fill: "#eef5f3" }} />
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
        <Tooltip content={<Dica />} cursor={{ fill: "#eef5f3" }} />
        <Bar dataKey="total" name="Gasto" radius={[6, 6, 0, 0]}>
          {lista.map((d) => <Cell key={d.categoria} fill={d.cor} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Entradas x saídas de cada mês
export function GraficoMensal({ dados, tipo }) {
  const lista = dados.map((d) => ({ ...d, nome: nomeMes(d.mes) }));

  // Partes que se repetem nos três tipos eu junto numa variável
  const comum = (
    <>
      <CartesianGrid vertical={false} stroke="#e4eeeb" />
      <XAxis dataKey="nome" tick={eixo} axisLine={false} tickLine={false} />
      <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
      <Tooltip content={<Dica />} cursor={{ fill: "#eef5f3" }} />
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

// ---------------------------------------------------------------------------
// Evolução do saldo acumulado ao longo dos dias
export function GraficoSaldo({ dados, tipo }) {
  const lista = dados.map((d) => ({ ...d, nome: nomeDia(d.dia) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      {tipo === "linha" ? (
        <LineChart data={lista} margin={{ left: -10, right: 10 }}>
          <CartesianGrid vertical={false} stroke="#e4eeeb" />
          <XAxis dataKey="nome" tick={eixo} axisLine={false} tickLine={false} />
          <YAxis tick={eixo} tickFormatter={curto} axisLine={false} tickLine={false} />
          <Tooltip content={<Dica />} />
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
          <Tooltip content={<Dica />} />
          <Area type="monotone" dataKey="saldo" name="Saldo" stroke={VERDE_LINHA} strokeWidth={3} fill="url(#degradeSaldo)" />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
