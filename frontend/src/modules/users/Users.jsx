// Users.jsx
// Cadastro da equipe (só o gestor acessa): criar usuário, trocar perfil, ativar/desativar
// e redefinir senha. O formulário e a tabela ficam em FormUsuario e TabelaUsuarios.
import { Plus } from "lucide-react";
import Alerta from "../../shared/Alert.jsx";
import Botao from "../../shared/Button.jsx";
import { Carregando } from "../../shared/Loading.jsx";
import Painel from "../../shared/Panel.jsx";
import { useFormulario } from "../../shared/useForm.js";
import { useMensagem } from "../../shared/useMessage.js";
import { useRequisicao } from "../../shared/useRequest.js";
import { useAuth } from "../auth/AuthContext.jsx";
import FormUsuario from "./UserForm.jsx";
import TabelaUsuarios from "./UserTable.jsx";
import { usuariosApi } from "./users.api.js";

// Valores iniciais do formulário de novo usuário
const FORM_VAZIO = { nome: "", email: "", senha: "", perfil: "ESTAGIARIO" };

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const { mensagem, avisarOk, avisarErro } = useMensagem();
  const { dados, setDados, erro, carregando } = useRequisicao(() => usuariosApi.listar());
  const lista = dados ?? [];
  const formulario = useFormulario(FORM_VAZIO, { aoErro: avisarErro });

  // Cadastra e mantém a lista em ordem alfabética
  async function criar(valores) {
    const novo = await usuariosApi.criar(valores);
    setDados((l) => [...l, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
    formulario.fechar();
    avisarOk(`${novo.nome} cadastrado.`);
  }

  // Serve para trocar perfil e para ativar/desativar; troca o usuário na lista pela versão nova
  async function atualizar(id, alteracoes) {
    try {
      const atualizado = await usuariosApi.atualizar(id, alteracoes);
      setDados((l) => l.map((u) => (u.id === atualizado.id ? atualizado : u)));
    } catch (err) {
      avisarErro(err.message);
    }
  }

  // Usa prompt() do navegador para manter a tela simples
  async function redefinirSenha(u) {
    const senhaNova = window.prompt(`Nova senha para ${u.nome} (mínimo 8 caracteres):`);
    if (!senhaNova) return;
    try {
      await usuariosApi.redefinirSenha(u.id, senhaNova);
      avisarOk(`Senha de ${u.nome} redefinida. Ela precisará entrar de novo.`);
    } catch (err) {
      avisarErro(err.message);
    }
  }

  if (carregando) return <Carregando texto="Buscando usuários..." />;

  return (
    <>
      <Alerta mensagem={mensagem} />
      <Alerta tipo="erro">{erro}</Alerta>

      <Painel
        titulo="Equipe"
        subtitulo={`${lista.filter((u) => u.ativo).length} usuários ativos`}
        acoes={<Botao icone={Plus} onClick={formulario.abrir}>Novo usuário</Botao>}
      >
        <FormUsuario formulario={formulario} aoSalvar={criar} />
        <TabelaUsuarios usuarios={lista} meuId={eu.id} aoAtualizar={atualizar} aoRedefinirSenha={redefinirSenha} />
      </Painel>
    </>
  );
}
