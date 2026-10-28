// Exportacao.jsx
// Módulo de exportação: cartões que baixam os dados em CSV, planilha (Excel), TXT ou OFX.
// O arquivo é gerado pelo backend (só perfis com permissão de relatório conseguem).
import { useState } from "react";
import Alerta from "../../compartilhado/Alerta.jsx";
import CartaoFormato from "./CartaoFormato.jsx";
import { exportacaoApi } from "./exportacao.api.js";
import { FORMATOS } from "./opcoes.js";

export default function Exportacao() {
  const [baixando, setBaixando] = useState(""); // id do formato que está sendo gerado
  const [erro, setErro] = useState("");

  // Pede o arquivo à API; o navegador baixa quando a resposta chega
  async function baixar(formato) {
    setBaixando(formato);
    setErro("");
    try {
      await exportacaoApi.baixar(formato);
    } catch (e) {
      setErro(e.message);
    }
    setBaixando("");
  }

  return (
    <>
      <Alerta tipo="erro">{erro}</Alerta>
      <section className="cards formatos">
        {FORMATOS.map((formato) => (
          <CartaoFormato
            key={formato.id}
            formato={formato}
            gerando={baixando === formato.id}
            bloqueado={baixando !== ""}
            aoBaixar={baixar}
          />
        ))}
      </section>
      <p className="nota">Todos os formatos incluem as categorias definidas no módulo Tratamento.</p>
    </>
  );
}
