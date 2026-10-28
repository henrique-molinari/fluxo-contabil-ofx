// Badge.jsx
// Etiqueta pequena e arredondada (categoria, situação, "você"...).
// cor="verde" deixa a etiqueta verde; sem cor ela fica cinza.

export default function Selo({ cor = "", className = "", children }) {
  return <span className={["selo", cor, className].filter(Boolean).join(" ")}>{children}</span>;
}
