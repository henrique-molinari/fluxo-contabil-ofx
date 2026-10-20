// Exportacao.jsx
// Módulo de exportação: botões que baixam os dados em CSV, planilha (Excel), TXT ou OFX.
// O arquivo é gerado pelo backend. Aqui eu busco o arquivo com fetch pra poder
// mostrar a animação de carregamento enquanto ele é gerado.
import { useState } from "react";
import { Download, FileCode, FileSpreadsheet, FileText, Landmark } from "lucide-react";
import { MiniSpinner } from "../components/Carregando.jsx";

// Lista dos formatos pra eu não repetir quatro cards iguais
const FORMATOS = [
  { id: "csv", titulo: "CSV", Icone: FileCode, texto: "Texto separado por ponto e vírgula. Abre no Excel e em outros sistemas." },
  { id: "xlsx", titulo: "Planilha Excel", Icone: FileSpreadsheet, texto: "Planilha .xlsx com as colunas já ajustadas e prontas para uso." },
  { id: "txt", titulo: "Relatório TXT", Icone: FileText, texto: "Relatório em texto simples, bom para imprimir ou conferir rápido." },
  { id: "ofx", titulo: "Extrato OFX", Icone: Landmark, texto: "Formato bancário. Pode ser importado de novo aqui ou em outros sistemas." },
];

export default function Exportacao() {
  const [baixando, setBaixando] = useState(""); // id do formato que está sendo gerado
  const [erro, setErro] = useState("");

  async function baixar(formato) {
    setBaixando(formato);
    setErro("");
    try {
      const resposta = await fetch(`/api/exportar/${formato}`);
      if (!resposta.ok) {
        // Se o backend mandou erro, ele vem em JSON
        const dados = await resposta.json();
        throw new Error(dados.erro || "Erro ao exportar");
      }
      // Transformo a resposta em arquivo e simulo um clique num link pra baixar
      const blob = await resposta.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `movimentacoes.${formato}`;
      link.click();
      URL.revokeObjectURL(link.href);
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
