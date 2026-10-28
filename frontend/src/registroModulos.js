// registroModulos.js
// Lista de todos os módulos do sistema. Cada um declara a permissão necessária:
// quem não tem a permissão nem vê o item no menu. Para criar um módulo novo,
// basta importar o componente e acrescentar uma linha aqui.
import { ClipboardList, FileOutput, LayoutDashboard, Tags, UploadCloud, Users } from "lucide-react";
import Analise from "./modulos/analise/Analise.jsx";
import Exportacao from "./modulos/exportacao/Exportacao.jsx";
import Importacao from "./modulos/importacao/Importacao.jsx";
import Tarefas from "./modulos/tarefas/Tarefas.jsx";
import Tratamento from "./modulos/tratamento/Tratamento.jsx";
import Usuarios from "./modulos/usuarios/Usuarios.jsx";

export const MODULOS = [
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
