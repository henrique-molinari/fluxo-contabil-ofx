// Tratamento.jsx
// Módulo de tratamento: lista as contas e, conforme o perfil do usuário:
//  - analista: classifica (manual ou automático), comenta e pode limpar a tabela;
//  - estagiário: só lança contas novas à mão e consulta a lista;
//  - gestor: consulta a lista e lê os comentários.
import { useEffect, useState } from "react";
import { Inbox, MessageSquare, Plus, Search, Trash2, Zap } from "lucide-react";
import { dataBR, dinheiro } from "../../compartilhado/formatos.js";
import { Carregando, MiniSpinner } from "../../compartilhado/Carregando.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import PainelComentarios from "../comentarios/PainelComentarios.jsx";
import { tratamentoApi } from "./tratamento.api.js";

const FORM_VAZIO = { data_movimentacao: "", tipo: "saida", valor: "", descricao: "" };

// Tabela de contas com busca, filtro por categoria, edição, lançamento manual e comentários
export default function Tratamento({ irPara }) {
  const { pode } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState(null); // null = ainda carregando
  const [categorias, setCategorias] = useState([]);
  const [mensagem, setMensagem] = useState(null); // {tipo: "ok" | "erro", texto}
  const [classificando, setClassificando] = useState(false);
  const [comentando, setComentando] = useState(null); // movimentação com o painel aberto

  // Lançamento manual
  const [form, setForm] = useState(null); // null = fechado
  const [salvando, setSalvando] = useState(false);

  // Filtros da tabela
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const podeEditar = pode("movimentacoes:editar");
  const podeVerComentarios = pode("comentarios:ler");

  // Ao abrir a tela, busca categorias e contas ao mesmo tempo
  useEffect(() => {
    Promise.all([tratamentoApi.categorias(), tratamentoApi.movimentacoes()])
      .then(([cats, movs]) => {
        setCategorias(cats);
        setMovimentacoes(movs);
      })
      .catch((e) => {
        setMovimentacoes([]);
        setMensagem({ tipo: "erro", texto: e.message });
      });
  }, []);

  // Altera a categoria no servidor e atualiza só essa linha na tela
  async function mudarCategoria(id, categoria) {
    try {
      await tratamentoApi.classificar(id, categoria);
      setMovimentacoes((lista) => lista.map((m) => (m.id === id ? { ...m, categoria } : m)));
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
  }

  // Aplica as regras automáticas em tudo que está "Sem categoria"
  async function classificarAutomatico() {
    setClassificando(true);
    try {
      const r = await tratamentoApi.classificarAutomatico();
      setMensagem({ tipo: "ok", texto: `${r.atualizadas} movimentações classificadas automaticamente.` });
      setMovimentacoes(await tratamentoApi.movimentacoes());
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
    setClassificando(false);
  }

  // Ação destrutiva: pede confirmação antes
  async function apagarTudo() {
    if (!window.confirm("Tem certeza que quer apagar TODAS as movimentações?")) return;
    try {
      const r = await tratamentoApi.apagarTudo();
      setMensagem({ tipo: "ok", texto: `${r.apagadas} movimentações apagadas.` });
      setMovimentacoes(await tratamentoApi.movimentacoes());
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
  }

  // Lançamento manual: saída vira valor negativo, entrada positivo
  async function lancar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const numero = Math.abs(Number(String(form.valor).replace(",", ".")));
      await tratamentoApi.criar({
        data_movimentacao: form.data_movimentacao,
        valor: form.tipo === "saida" ? -numero : numero,
        descricao: form.descricao,
      });
      setMensagem({ tipo: "ok", texto: "Lançamento registrado." });
      setForm(null);
      setMovimentacoes(await tratamentoApi.movimentacoes());
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message });
    }
    setSalvando(false);
  }

  // O painel de comentários avisa quando alguém comentou/apagou, para atualizar o contador
  function ajustarComentarios(id, delta) {
    setMovimentacoes((lista) =>
      lista.map((m) => (m.id === id ? { ...m, qtd_comentarios: m.qtd_comentarios + delta } : m))
    );
  }

  if (movimentacoes === null) return <Carregando texto="Buscando movimentações no banco..." />;

  const formulario = form && (
    <form className="form-linha" onSubmit={lancar}>
      <label>Data
        <input type="date" required value={form.data_movimentacao}
          onChange={(e) => setForm({ ...form, data_movimentacao: e.target.value })} />
      </label>
      <label>Tipo
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
      </label>
      <label>Valor (R$)
        <input type="text" inputMode="decimal" required placeholder="0,00" value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })} />
      </label>
      <label className="cresce">Descrição
        <input type="text" required maxLength={255} value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </label>
      <button className="botao" disabled={salvando}>{salvando ? <MiniSpinner /> : "Salvar"}</button>
      <button type="button" className="botao claro" onClick={() => setForm(null)}>Cancelar</button>
    </form>
  );

  const botaoNovo = pode("movimentacoes:criar") && (
    <button className="botao claro" onClick={() => setForm({ ...FORM_VAZIO })}>
      <Plus size={16} /> Novo lançamento
    </button>
  );

  // Banco vazio: oriento o usuário
  if (movimentacoes.length === 0) {
    return (
      <>
        {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}
        <div className="painel vazio">
          <div className="icone-vazio"><Inbox size={30} /></div>
          <h2>Nada por aqui ainda</h2>
          <p>Importe um arquivo OFX ou faça um lançamento manual.</p>
          <div className="acoes centro">
            {pode("importacao:criar") && (
              <button className="botao" onClick={() => irPara("importacao")}>Ir para Importação</button>
            )}
            {botaoNovo}
          </div>
          {formulario}
        </div>
      </>
    );
  }

  const semCategoria = movimentacoes.filter((m) => m.categoria === "Sem categoria").length;
  const classificadas = movimentacoes.length - semCategoria;
  const progresso = Math.round((classificadas / movimentacoes.length) * 100);

  const filtradas = movimentacoes.filter((m) => {
    const bateBusca = m.descricao.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = filtroCategoria === "Todas" || m.categoria === filtroCategoria;
    return bateBusca && bateCategoria;
  });

  return (
    <>
      {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}

      <section className="painel progresso">
        <div className="progresso-texto">
          <h2>{progresso}% classificado</h2>
          <p>{classificadas} de {movimentacoes.length} contas já têm categoria · {semCategoria} pendentes</p>
        </div>
        <div className="barra grande"><div style={{ width: `${progresso}%` }} /></div>
      </section>

      <section className="painel">
        <div className="painel-topo">
          <div>
            <h2>Contas</h2>
            <p>{podeEditar ? "Escolha a categoria de cada movimentação" : "Consulta das movimentações"}</p>
          </div>
          <div className="acoes sem-margem">
            {botaoNovo}
            {podeEditar && (
              <button className="botao" onClick={classificarAutomatico} disabled={classificando}>
                {classificando ? <MiniSpinner /> : <Zap size={16} />} Classificar automaticamente
              </button>
            )}
            {pode("movimentacoes:apagar") && (
              <button className="botao perigo" onClick={apagarTudo}>
                <Trash2 size={16} /> Limpar tabela
              </button>
            )}
          </div>
        </div>

        {formulario}

        <div className="filtros">
          <div className="campo-busca">
            <Search size={16} />
            <input type="search" placeholder="Buscar pela descrição" value={busca}
              onChange={(e) => setBusca(e.target.value)} />
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option>Todas</option>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span className="contagem">{filtradas.length} resultado(s)</span>
        </div>

        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Descrição</th><th>Categoria</th><th className="direita">Valor</th>
                {podeVerComentarios && <th />}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((m) => (
                <tr key={m.id}>
                  <td className="num">{dataBR(m.data_movimentacao)}</td>
                  <td>{m.descricao}</td>
                  <td>
                    {podeEditar ? (
                      <select value={m.categoria} onChange={(e) => mudarCategoria(m.id, e.target.value)}>
                        {categorias.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span className="selo">{m.categoria}</span>
                    )}
                  </td>
                  <td className={`direita num ${m.valor >= 0 ? "positivo" : "negativo"}`}>{dinheiro(m.valor)}</td>
                  {podeVerComentarios && (
                    <td className="direita">
                      <button className="botao claro pequeno" onClick={() => setComentando(m)}>
                        <MessageSquare size={14} /> {m.qtd_comentarios}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {comentando && (
        <PainelComentarios
          movimentacao={comentando}
          aoFechar={() => setComentando(null)}
          aoMudarQuantidade={ajustarComentarios}
        />
      )}
    </>
  );
}
