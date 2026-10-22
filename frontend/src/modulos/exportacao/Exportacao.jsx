// Exportacao.jsx
// Módulo de exportação: botões que baixam os dados em CSV, planilha (Excel), TXT ou OFX.
// O arquivo é gerado pelo backend (só perfis com permissão de relatório conseguem).
import { useState } from "react";
import { Download, FileCode, FileSpreadsheet, FileText, Landmark } from "lucide-react";
import { MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { exportacaoApi } from "./exportacao.api.js";

// Lista dos formatos pra eu não repetir quatro cards iguais
const FORMATOS = [
  { id: "csv", titulo: "CSV", Icone: FileCode, texto: "Texto separado por ponto e vírgula. Abre no Excel e em outros sistemas." },
  { id: "xlsx", titulo: "Planilha Excel", Icone: FileSpreadsheet, texto: "Planilha .xlsx com as colunas já ajustadas e prontas para uso." },
  { id: "txt", titulo: "Relatório TXT", Icone: FileText, texto: "Relatório em texto simples, bom para imprimir ou conferir rápido." },
  { id: "ofx", titulo: "Extrato OFX", Icone: Landmark, texto: "Formato bancário. Pode ser importado de novo aqui ou em outros sistemas." },
];

// Cartões de download: um por formato
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
      {erro && <div className="alerta erro">{erro}</div>}
      <section className="cards formatos">
        {FORMATOS.map(({ id, titulo, Icone, texto }) => (
          <div className="formato" key={id}>
            <div className="kpi-icone verde"><Icone size={22} /></div>
            <h3>{titulo}</h3>
            <p>{texto}</p>
            <button className="botao" onClick={() => baixar(id)} disabled={baixando !== ""}>
              {baixando === id ? <MiniSpinner /> : <Download size={16} />}
              {baixando === id ? "Gerando..." : `Baixar .${id}`}
            </button>
          </div>
        ))}
      </section>
      <p className="nota">Todos os formatos incluem as categorias definidas no módulo Tratamento.</p>
    </>
  );
}
