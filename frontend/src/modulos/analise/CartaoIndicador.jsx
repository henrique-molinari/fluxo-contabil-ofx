// CartaoIndicador.jsx
// Cartão de um número importante (entradas, saídas, saldo...): ícone colorido, título, valor e uma frase de apoio.

export default function CartaoIndicador({ titulo, valor, apoio, icone: Icone, cor }) {
  return (
    <div className="kpi">
      <div className={`kpi-icone ${cor}`}><Icone size={20} /></div>
      <span className="kpi-titulo">{titulo}</span>
      <strong className="kpi-valor">{valor}</strong>
      <span className="kpi-apoio">{apoio}</span>
    </div>
  );
}
