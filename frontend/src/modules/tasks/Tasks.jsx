// Tasks.jsx
// O gestor cria e delega tarefas (ex.: pedir um balanço). Cada pessoa vê as suas
// e muda o andamento: Pendente -> Em andamento -> Concluída.
// Esta tela só orquestra: o formulário e a tabela ficam em FormTarefa e TabelaTarefas.
import { ClipboardList, Plus } from "lucide-react";
import Alerta from "../../shared/Alert.jsx";
import Botao from "../../shared/Button.jsx";
import { Carregando } from "../../shared/Loading.jsx";
import EstadoVazio from "../../shared/EmptyState.jsx";
import Painel from "../../shared/Panel.jsx";
import { useFormulario } from "../../shared/useForm.js";
import { useMensagem } from "../../shared/useMessage.js";
import { useRequisicao } from "../../shared/useRequest.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { usuariosApi } from "../users/users.api.js";
import { FORM_VAZIO } from "./constants.js";
import FormTarefa from "./TaskForm.jsx";
import TabelaTarefas from "./TaskTable.jsx";
import { tarefasApi } from "./tasks.api.js";

export default function Tarefas() {
  const { pode } = useAuth();
  const podeCriar = pode("tarefas:criar");
  const { mensagem, avisarOk, avisarErro } = useMensagem();

  // dados === null significa "ainda carregando"; [] significa "carregou e está vazio"
  const { dados, setDados, erro, carregando } = useRequisicao(() => tarefasApi.listar());
  const tarefas = dados ?? [];

  // A lista de pessoas só é necessária (e só é permitida) para quem delega
  const { dados: usuarios } = useRequisicao(() => (podeCriar ? usuariosApi.listar() : Promise.resolve([])), [podeCriar]);
  const equipe = (usuarios ?? []).filter((u) => u.ativo);

  const formulario = useFormulario(FORM_VAZIO, { aoErro: avisarErro });

  // Gestor delega uma tarefa nova e a coloca no topo da lista
  async function criar(valores) {
    const nova = await tarefasApi.criar({
      titulo: valores.titulo,
      descricao: valores.descricao || undefined,
      tipo: valores.tipo,
      atribuido_a: Number(valores.atribuido_a),
      prazo: valores.prazo || undefined,
    });
    setDados((lista) => [nova, ...lista]);
    formulario.fechar();
    avisarOk(`Tarefa delegada para ${nova.atribuido_a_nome}.`);
  }

  // Troca o andamento; a API devolve a tarefa atualizada para substituir na lista
  async function mudarStatus(id, status) {
    try {
      const atualizada = await tarefasApi.mudarStatus(id, status);
      setDados((lista) => lista.map((t) => (t.id === id ? atualizada : t)));
    } catch (err) {
      avisarErro(err.message);
    }
  }

  // Pede confirmação antes de excluir
  async function excluir(id) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    try {
      await tarefasApi.excluir(id);
      setDados((lista) => lista.filter((t) => t.id !== id));
    } catch (err) {
      avisarErro(err.message);
    }
  }

  if (carregando) return <Carregando texto="Buscando tarefas..." />;

  return (
    <>
      <Alerta mensagem={mensagem} />
      <Alerta tipo="erro">{erro}</Alerta>

      <Painel
        titulo={podeCriar ? "Tarefas da equipe" : "Minhas tarefas"}
        subtitulo={`${tarefas.filter((t) => t.status !== "CONCLUIDA").length} em aberto`}
        acoes={podeCriar && <Botao icone={Plus} onClick={formulario.abrir}>Nova tarefa</Botao>}
      >
        <FormTarefa formulario={formulario} aoSalvar={criar} equipe={equipe} />

        {tarefas.length === 0 ? (
          <EstadoVazio
            interno
            icone={ClipboardList}
            texto={podeCriar ? "Nenhuma tarefa criada ainda." : "Você não tem tarefas no momento."}
          />
        ) : (
          <TabelaTarefas tarefas={tarefas} ehGestor={podeCriar} aoMudarStatus={mudarStatus} aoExcluir={excluir} />
        )}
      </Painel>
    </>
  );
}
