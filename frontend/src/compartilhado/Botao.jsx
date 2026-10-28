// Botao.jsx
// Botão padrão do sistema. Cuida sozinho de três coisas que se repetiam em todas as telas:
//  - a cor (variante "claro" ou "perigo"; sem variante é o botão principal);
//  - o tamanho (pequeno);
//  - o estado "carregando": troca o ícone por um spinner e desabilita o clique.
// Qualquer outra propriedade (onClick, type, disabled...) vai direto para o <button>.
import { MiniSpinner } from "./Carregando.jsx";

export default function Botao({ variante = "", pequeno = false, carregando = false, icone: Icone, children, disabled, ...resto }) {
  const classes = ["botao", variante, pequeno && "pequeno"].filter(Boolean).join(" ");
  return (
    <button className={classes} disabled={disabled || carregando} {...resto}>
      {carregando ? <MiniSpinner /> : Icone && <Icone size={pequeno ? 14 : 16} />}
      {children}
    </button>
  );
}
