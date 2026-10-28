// CartoesResumo.jsx
// Os 4 cartões do topo do painel de análise, montados a partir do resumo que vem da API.
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Wallet } from "lucide-react";
import { dinheiro } from "../../compartilhado/formatos.js";
import CartaoIndicador from "./CartaoIndicador.jsx";

export default function CartoesResumo({ resumo }) {
  // Dados dos cartões (cada um com ícone, cor e uma frase de apoio)
  const cartoes = [
    { titulo: "Entradas", valor: dinheiro(resumo.entradas), apoio: `${resumo.qtd_entradas} lançamentos`, icone: ArrowDownLeft, cor: "verde" },
    { titulo: "Saídas", valor: dinheiro(Math.abs(resumo.saidas)), apoio: `${resumo.qtd_saidas} lançamentos`, icone: ArrowUpRight, cor: "petroleo" },
    { titulo: "Saldo", valor: dinheiro(resumo.saldo), apoio: resumo.saldo >= 0 ? "Resultado positivo" : "Resultado negativo", icone: Wallet, cor: "verde" },
    { titulo: "Movimentações", valor: resumo.quantidade, apoio: "No período importado", icone: ReceiptText, cor: "neutro" },
  ];

  return (
    <section className="cards">
      {cartoes.map((c) => <CartaoIndicador key={c.titulo} {...c} />)}
    </section>
  );
}
