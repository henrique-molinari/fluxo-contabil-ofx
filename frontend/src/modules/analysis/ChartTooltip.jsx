// ChartTooltip.jsx
// Caixinha que aparece quando o mouse passa por cima de um gráfico (o "tooltip" do Recharts).
import { dinheiro } from "../../shared/formats.js";

export default function DicaGrafico({ active, payload, label }) {
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
