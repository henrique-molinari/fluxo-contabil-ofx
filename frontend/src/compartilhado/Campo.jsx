// Campo.jsx
// Rótulo + campo de formulário (input, select ou textarea vai como filho).
// O estilo (rótulo pequeno em cima do campo) vem do CSS de ".form-linha label".
//   <Campo rotulo="Data"><input type="date" /></Campo>
// Use className="cresce" para o campo ocupar o espaço que sobrar na linha.

export default function Campo({ rotulo, className, children }) {
  return (
    <label className={className}>
      {rotulo}
      {children}
    </label>
  );
}
