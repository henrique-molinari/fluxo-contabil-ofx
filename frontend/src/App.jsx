// App.jsx
// Componente principal. Ele monta o layout do ERP: menu lateral + área do módulo.
// São 4 módulos, cada um com uma função só:
//  Análise -> Importação -> Tratamento -> Exportação
import { useState } from "react";
import { FileOutput, Landmark, LayoutDashboard, Tags, UploadCloud } from "lucide-react";
import Analise from "./pages/Analise.jsx";
import Importacao from "./pages/Importacao.jsx";
import Tratamento from "./pages/Tratamento.jsx";
import Exportacao from "./pages/Exportacao.jsx";

// Lista dos módulos (cada um vira um item do menu).
// "Icone" vem da biblioteca lucide-react (troquei os emojis por ícones de verdade).
const MODULOS = [
  { id: "analise", nome: "Painel de análise", Icone: LayoutDashboard, grupo: "Visão geral", componente: Analise,
    descricao: "Acompanhe entradas, saídas e para onde o dinheiro está indo." },
  { id: "importacao", nome: "Importação", Icone: UploadCloud, grupo: "Dados", componente: Importacao,
    descricao: "Envie um novo extrato OFX para o banco de dados." },
  { id: "tratamento", nome: "Tratamento", Icone: Tags, grupo: "Dados", componente: Tratamento,
    descricao: "Classifique cada conta em uma categoria." },
  { id: "exportacao", nome: "Exportação", Icone: FileOutput, grupo: "Saída", componente: Exportacao,
    descricao: "Baixe os dados em CSV, planilha, TXT ou OFX." },
];

export default function App() {
  // Guarda qual módulo está aberto agora
  const [moduloAtual, setModuloAtual] = useState("analise");

  // Procuro na lista o módulo escolhido pra renderizar ele
  const modulo = MODULOS.find((m) => m.id === moduloAtual);
  const Pagina = modulo.componente;

  // Pego os nomes dos grupos sem repetir (Visão geral, Dados, Saída)
  const grupos = [...new Set(MODULOS.map((m) => m.grupo))];

  return (
    <div className="layout">
      {/* Menu lateral */}
      <aside className="menu">
        <div className="marca">
          <div className="marca-icone"><Landmark size={20} /></div>
          <div>
            <strong>Fluxo Contábil</strong>
            <small>Extratos OFX</small>
          </div>
        </div>

        <nav>
          {/* Para cada grupo eu mostro o título e os módulos dele */}
          {grupos.map((grupo) => (
            <div key={grupo}>
              <div className="grupo-menu">{grupo}</div>
              {MODULOS.filter((m) => m.grupo === grupo).map(({ id, nome, Icone }) => (
                <button
                  key={id}
                  className={id === moduloAtual ? "item ativo" : "item"}
                  onClick={() => setModuloAtual(id)}
                >
                  <Icone size={18} /> {nome}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="rodape-menu">
          <span className="ponto" /> Conectado ao PostgreSQL
        </div>
      </aside>

      {/* Área principal */}
      <main className="conteudo">
        <header className="topo">
          <div className="trilha">Fluxo Contábil / {modulo.grupo}</div>
          <h1>{modulo.nome}</h1>
          <p>{modulo.descricao}</p>
        </header>
        {/* key faz a página recarregar os dados quando eu troco de módulo.
            Passo "irPara" pra uma tela conseguir mandar o usuário pra outra (ex: após importar). */}
        <Pagina key={moduloAtual} irPara={setModuloAtual} />
      </main>
    </div>
  );
}
