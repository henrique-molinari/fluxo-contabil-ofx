// App.jsx
// Componente principal. Sem login mostra a tela de entrada; logado, monta o layout do ERP:
// menu lateral + área do módulo. O menu só lista os módulos que o perfil tem permissão de usar.
import { useState } from "react";
import {
  ClipboardList, FileOutput, Landmark, LayoutDashboard, LogOut, Tags, UploadCloud, Users,
} from "lucide-react";
import { Carregando } from "./compartilhado/Carregando.jsx";
import { NOME_PERFIL } from "./compartilhado/formatos.js";
import { AuthProvider, useAuth } from "./modulos/auth/AuthContext.jsx";
import Login from "./modulos/auth/Login.jsx";
import Analise from "./modulos/analise/Analise.jsx";
import Importacao from "./modulos/importacao/Importacao.jsx";
import Tratamento from "./modulos/tratamento/Tratamento.jsx";
import Tarefas from "./modulos/tarefas/Tarefas.jsx";
import Exportacao from "./modulos/exportacao/Exportacao.jsx";
import Usuarios from "./modulos/usuarios/Usuarios.jsx";

// Cada módulo declara a permissão necessária. Quem não tem, nem vê o item no menu.
const MODULOS = [
  { id: "analise", nome: "Painel de análise", Icone: LayoutDashboard, grupo: "Visão geral", permissao: "analise:ler", componente: Analise,
    descricao: "Acompanhe entradas, saídas e para onde o dinheiro está indo." },
  { id: "tarefas", nome: "Tarefas", Icone: ClipboardList, grupo: "Visão geral", permissao: "tarefas:ler", componente: Tarefas,
    descricao: "Pedidos e atividades delegadas para a equipe." },
  { id: "importacao", nome: "Importação", Icone: UploadCloud, grupo: "Dados", permissao: "importacao:criar", componente: Importacao,
    descricao: "Envie um novo extrato OFX para o banco de dados." },
  { id: "tratamento", nome: "Tratamento", Icone: Tags, grupo: "Dados", permissao: "movimentacoes:ler", componente: Tratamento,
    descricao: "Classifique, ajuste e comente as contas." },
  { id: "exportacao", nome: "Exportação", Icone: FileOutput, grupo: "Saída", permissao: "relatorios:exportar", componente: Exportacao,
    descricao: "Baixe os dados em CSV, planilha, TXT ou OFX." },
  { id: "usuarios", nome: "Usuários", Icone: Users, grupo: "Administração", permissao: "usuarios:gerenciar", componente: Usuarios,
    descricao: "Cadastre a equipe e defina o perfil de cada pessoa." },
];

// Layout do sistema (só aparece logado): menu lateral + módulo escolhido
function Sistema() {
  const { usuario, pode, sair } = useAuth();
  // Filtra os módulos pelo que o perfil pode usar
  const permitidos = MODULOS.filter((m) => pode(m.permissao));
  const [moduloAtual, setModuloAtual] = useState(permitidos[0]?.id);

  const modulo = permitidos.find((m) => m.id === moduloAtual) ?? permitidos[0];
  if (!modulo) {
    return <div className="alerta erro">Seu perfil ainda não tem acesso a nenhum módulo.</div>;
  }
  const Pagina = modulo.componente;
  const grupos = [...new Set(permitidos.map((m) => m.grupo))];

  return (
    <div className="layout">
      <aside className="menu">
        <div className="marca">
          <div className="marca-icone"><Landmark size={20} /></div>
          <div>
            <strong>Fluxo Contábil</strong>
            <small>Extratos OFX</small>
          </div>
        </div>

        <nav>
          {grupos.map((grupo) => (
            <div key={grupo}>
              <div className="grupo-menu">{grupo}</div>
              {permitidos.filter((m) => m.grupo === grupo).map(({ id, nome, Icone }) => (
                <button
                  key={id}
                  className={id === modulo.id ? "item ativo" : "item"}
                  onClick={() => setModuloAtual(id)}
                >
                  <Icone size={18} /> {nome}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="rodape-menu">
          <div className="usuario-menu">
            <strong>{usuario.nome}</strong>
            <small>{NOME_PERFIL[usuario.perfil]}</small>
          </div>
          <button className="icone-botao claro-escuro" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="conteudo">
        <header className="topo">
          <div className="trilha">Fluxo Contábil / {modulo.grupo}</div>
          <h1>{modulo.nome}</h1>
          <p>{modulo.descricao}</p>
        </header>
        {/* key faz a página recarregar os dados quando troco de módulo */}
        <Pagina key={modulo.id} irPara={setModuloAtual} />
      </main>
    </div>
  );
}

// Decide o que mostrar: spinner (checando sessão), login ou o sistema
function Porteiro() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Carregando texto="Verificando sessão..." />;
  return usuario ? <Sistema key={usuario.id} /> : <Login />;
}

// AuthProvider deixa o usuário logado disponível para todas as telas
export default function App() {
  return (
    <AuthProvider>
      <Porteiro />
    </AuthProvider>
  );
}
