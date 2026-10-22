// Tarefas.jsx
// O gestor cria e delega tarefas (ex.: pedir um balanço). Cada pessoa vê as suas
// e muda o andamento: Pendente -> Em andamento -> Concluída.
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { dataBR } from "../../compartilhado/formatos.js";
import { Carregando, MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { usuariosApi } from "../usuarios/usuarios.api.js";
import { tarefasApi } from "./tarefas.api.js";

// Textos amigáveis para os códigos que a API usa
const STATUS = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída" };
const TIPOS = { GERAL: "Geral", BALANCO: "Balanço" };
// Valores iniciais do formulário de nova tarefa
const FORM_VAZIO = { titulo: "", descricao: "", tipo: "BALANCO", atribuido_a: "", prazo: "" };

export default function Tarefas() {
  const { pode } = useAuth();
  const podeCriar = pode("tarefas:criar");
  // tarefas === null significa "ainda carregando"; [] significa "carregou e está vazio"
  const [tarefas, setTarefas] = useState(null);
  const [equipe, setEquipe] = useState([]);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    tarefasApi.listar().then(setTarefas).catch((e) => { setTarefas([]); setMensagem({ tipo: "erro", texto: e.message }); });
    // A lista de pessoas só é necessária (e só é permitida) para quem delega
    if (podeCriar) usuariosApi.listar().then((u) => setEquipe(u.filter((x) => x.ativo))).catch(() => {});
  }, [podeCriar]);

  // Gestor delega uma tarefa nova e a coloca no topo da lista
  async function criar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const nova = await tarefasApi.criar({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        tipo: form.tipo,
        atribuido_a: Number(form.atribuido_a),
        prazo: form.prazo || undefined,
      });
      setTarefas((l) => [nova, ...l]);
      setForm(null);
      setMensagem({ tipo: "ok", texto: `Tarefa delegada para ${nova.atribuido_a_nome}.` });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
    setSalvando(false);
  }

  // Troca o andamento; a API devolve a tarefa atualizada para substituir na lista
  async function mudarStatus(id, status) {
    try {
      const atualizada = await tarefasApi.mudarStatus(id, status);
      setTarefas((l) => l.map((t) => (t.id === id ? atualizada : t)));
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
  }

  // Pede confirmação antes de excluir
  async function excluir(id) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    try {
      await tarefasApi.excluir(id);
      setTarefas((l) => l.filter((t) => t.id !== id));
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
  }

  if (tarefas === null) return <Carregando texto="Buscando tarefas..." />;

  return (
    <>
      {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}

      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>{podeCriar ? "Tarefas da equipe" : "Minhas tarefas"}</h2>
            <p>{tarefas.filter((t) => t.status !== "CONCLUIDA").length} em aberto</p>
          </div>
          {podeCriar && (
            <button className="botao" onClick={() => setForm({ ...FORM_VAZIO })}><Plus size={16} /> Nova tarefa</button>
          )}
        </div>

        {form && (
          <form className="form-linha" onSubmit={criar}>
            <label className="cresce">Título
              <input type="text" required minLength={3} maxLength={160} value={form.titulo}
                placeholder="Ex.: Balanço de setembro"
                onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <label>Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </label>
            <label>Responsável
              <select required value={form.atribuido_a} onChange={(e) => setForm({ ...form, atribuido_a: e.target.value })}>
                <option value="">Escolha...</option>
                {equipe.filter((u) => u.perfil !== "GESTOR").map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </label>
            <label>Prazo
              <input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </label>
            <label className="cresce linha-inteira">Detalhes (opcional)
              <input type="text" maxLength={2000} value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </label>
            <button className="botao" disabled={salvando}>{salvando ? <MiniSpinner /> : "Delegar"}</button>
            <button type="button" className="botao claro" onClick={() => setForm(null)}>Cancelar</button>
          </form>
        )}

        {tarefas.length === 0 ? (
          <div className="vazio-interno">
            <div className="icone-vazio"><ClipboardList size={28} /></div>
            <p>{podeCriar ? "Nenhuma tarefa criada ainda." : "Você não tem tarefas no momento."}</p>
          </div>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Tarefa</th><th>Tipo</th>
                  <th>{podeCriar ? "Responsável" : "Pedida por"}</th>
                  <th>Prazo</th><th>Situação</th>{podeCriar && <th />}
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t) => (
                  <tr key={t.id} className={t.status === "CONCLUIDA" ? "apagada" : ""}>
                    <td>
                      <b>{t.titulo}</b>
                      {t.descricao && <div className="mudo">{t.descricao}</div>}
                    </td>
                    <td><span className="selo">{TIPOS[t.tipo]}</span></td>
                    <td>{podeCriar ? t.atribuido_a_nome : t.criado_por_nome}</td>
                    <td className="num">{t.prazo ? dataBR(t.prazo) : "—"}</td>
                    <td>
                      <select value={t.status} onChange={(e) => mudarStatus(t.id, e.target.value)}>
                        {Object.entries(STATUS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                      </select>
                    </td>
                    {podeCriar && (
                      <td className="direita">
                        <button className="icone-botao" onClick={() => excluir(t.id)} aria-label="Excluir tarefa">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
