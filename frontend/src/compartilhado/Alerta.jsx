// Alerta.jsx
// Faixa de aviso usada em todas as telas (verde para sucesso, vermelha para erro).
// Dois jeitos de usar:
//   <Alerta mensagem={{ tipo: "ok", texto: "Salvo!" }} />
//   <Alerta tipo="erro">{textoDoErro}</Alerta>
// Se não houver texto nenhum, não desenha nada (assim dá para usar sempre, sem "if").

export default function Alerta({ mensagem, tipo = mensagem?.tipo, children = mensagem?.texto }) {
  if (!children) return null;
  return <div className={`alerta ${tipo}`} role={tipo === "erro" ? "alert" : "status"}>{children}</div>;
}
