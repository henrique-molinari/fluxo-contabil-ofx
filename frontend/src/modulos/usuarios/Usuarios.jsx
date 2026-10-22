// Usuarios.jsx
// Cadastro da equipe (só o gestor acessa): criar usuário, trocar perfil, ativar/desativar
// e redefinir senha.
import { useEffect, useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { NOME_PERFIL } from "../../compartilhado/formatos.js";
import { Carregando, MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { usuariosApi } from "./usuarios.api.js";

// Valores iniciais do formulário de novo usuário
const FORM_VAZIO = { nome: "", email: "", senha: "", perfil: "ESTAGIARIO" };

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    usuariosApi.listar().then(setLista).catch((e) => { setLista([]); setMensagem({ tipo: "erro", texto: e.message }); });
  }, []);

  // Substitui um usuário na lista pela versão atualizada que veio da API
  const trocar = (atualizado) => setLista((l) => l.map((u) => (u.id === atualizado.id ? atualizado : u)));

  // Cadastra e mantém a lista em ordem alfabética
  async function criar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const novo = await usuariosApi.criar(form);
      setLista((l) => [...l, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm(null);
      setMensagem({ tipo: "ok", texto: `${novo.nome} cadastrado.` });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
    setSalvando(false);
  }

  // Serve para trocar perfil e para ativar/desativar
  async function atualizar(id, dados) {
    try {
      trocar(await usuariosApi.atualizar(id, dados));
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
  }

  // Usa prompt() do navegador para manter a tela simples
  async function redefinirSenha(u) {
    const senhaNova = window.prompt(`Nova senha para ${u.nome} (mínimo 8 caracteres):`);
    if (!senhaNova) return;
    try {
      await usuariosApi.redefinirSenha(u.id, senhaNova);
      setMensagem({ tipo: "ok", texto: `Senha de ${u.nome} redefinida. Ela precisará entrar de novo.` });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
  }

  if (lista === null) return <Carregando texto="Buscando usuários..." />;

  return (
    <>
      {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}

      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Equipe</h2>
            <p>{lista.filter((u) => u.ativo).length} usuários ativos</p>
          </div>
          <button className="botao" onClick={() => setForm({ ...FORM_VAZIO })}><Plus size={16} /> Novo usuário</button>
        </div>

        {form && (
          <form className="form-linha" onSubmit={criar}>
            <label className="cresce">Nome
              <input type="text" required minLength={2} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </label>
            <label className="cresce">E-mail
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>Senha inicial
              <input type="password" required minLength={8} autoComplete="new-password" value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            </label>
            <label>Perfil
              <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
                {Object.entries(NOME_PERFIL).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </label>
            <button className="botao" disabled={salvando}>{salvando ? <MiniSpinner /> : "Cadastrar"}</button>
            <button type="button" className="botao claro" onClick={() => setForm(null)}>Cancelar</button>
          </form>
        )}

        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th /></tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                // A própria conta não pode mudar de perfil nem se desativar (a API também bloqueia)
                const sou = u.id === eu.id;
                return (
                  <tr key={u.id} className={u.ativo ? "" : "apagada"}>
                    <td><b>{u.nome}</b>{sou && <span className="selo verde margem-esq">você</span>}</td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.perfil} disabled={sou} onChange={(e) => atualizar(u.id, { perfil: e.target.value })}>
                        {Object.entries(NOME_PERFIL).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                      </select>
                    </td>
                    <td>{u.ativo ? <span className="selo verde">Ativo</span> : <span className="selo">Desativado</span>}</td>
                    <td className="direita">
                      <div className="acoes sem-margem" style={{ justifyContent: "flex-end" }}>
                        <button className="botao claro pequeno" onClick={() => redefinirSenha(u)}>
                          <KeyRound size={14} /> Senha
                        </button>
                        {!sou && (
                          <button className={`botao pequeno ${u.ativo ? "perigo" : "claro"}`}
                            onClick={() => atualizar(u.id, { ativo: !u.ativo })}>
                            {u.ativo ? "Desativar" : "Reativar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
