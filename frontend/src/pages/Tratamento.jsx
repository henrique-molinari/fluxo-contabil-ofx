// Tratamento.jsx
// Módulo de tratamento: aqui o usuário classifica as contas por categoria.
// Dá pra classificar uma por uma (select) ou usar o botão de classificação automática.
// Também coloquei filtros pra achar mais rápido uma movimentação.
import { useEffect, useState } from "react";
import { Inbox, Search, Trash2, Zap } from "lucide-react";
import { api, dataBR, dinheiro } from "../api.js";
import { Carregando, MiniSpinner } from "../components/Carregando.jsx";

export default function Tratamento({ irPara }) {
  const [movimentacoes, setMovimentacoes] = useState(null); // null = ainda carregando
  const [categorias, setCategorias] = useState([]);
  const [mensagem, setMensagem] = useState(null); // {tipo: "ok" | "erro", texto}
  const [classificando, setClassificando] = useState(false);

  // Filtros da tabela
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Ao abrir a tela, carrego categorias e movimentações
  useEffect(() => {
    Promise.all([api.categorias(), api.movimentacoes()])
      .then(([cats, movs]) => {
        setCategorias(cats);
        setMovimentacoes(movs);
      })
      .catch((e) => {
        setMovimentacoes([]);
        setMensagem({ tipo: "erro", texto: e.message });
      });
  }, []);

  // Classificação manual: usuário escolhe a categoria no select
  async function mudarCategoria(id, categoria) {
    try {
      await api.classificar(id, categoria);
      // Atualizo só essa linha na tela, sem recarregar tudo
      setMovimentacoes((lista) => lista.map((m) => (m.id === id ? { ...m, categoria } : m)));
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
  }

  // Classificação automática pelas regras do backend
  async function classificarAutomatico() {
    setClassificando(true);
    try {
      const r = await api.classificarAutomatico();
      setMensagem({ tipo: "ok", texto: `${r.atualizadas} movimentações classificadas automaticamente.` });
      setMovimentacoes(await api.movimentacoes());
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
    setClassificando(false);
  }

  // Apaga tudo (peço confirmação antes pra não apagar sem querer)
  async function apagarTudo() {
    if (!window.confirm("Tem certeza que quer apagar TODAS as movimentações?")) return;
    try {
      const r = await api.apagarTudo();
      setMensagem({ tipo: "ok", texto: `${r.apagadas} movimentações apagadas.` });
      setMovimentacoes(await api.movimentacoes());
    } catch (e) {
      setMensagem({ tipo: "erro", texto: e.message });
    }
  }

  // Enquanto não chegou nada do backend mostro o carregando
  if (movimentacoes === null) return <Carregando texto="Buscando movimentações no banco..." />;

  // Banco vazio: oriento o usuário
  if (movimentacoes.length === 0) {
    return (
      <>
        {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}
        <div className="painel vazio">
          <div className="icone-vazio"><Inbox size={30} /></div>
          <h2>Nada para classificar</h2>
          <p>Importe um arquivo OFX primeiro.</p>
          <button className="botao" onClick={() => irPara("importacao")}>Ir para Importação</button>
        </div>
      </>
    );
  }

  const semCategoria = movimentacoes.filter((m) => m.categoria === "Sem categoria").length;
  const classificadas = movimentacoes.length - semCategoria;
  const progresso = Math.round((classificadas / movimentacoes.length) * 100);

  // Aplico os filtros (texto digitado + categoria escolhida)
  const filtradas = movimentacoes.filter((m) => {
    const bateBusca = m.descricao.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = filtroCategoria === "Todas" || m.categoria === filtroCategoria;
    return bateBusca && bateCategoria;
  });

  return (
    <>
      {mensagem && <div className={`alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}

      {/* Progresso da classificação */}
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
            <p>Escolha a categoria de cada movimentação</p>
          </div>
          <div className="acoes sem-margem">
            <button className="botao" onClick={classificarAutomatico} disabled={classificando}>
              {classificando ? <MiniSpinner /> : <Zap size={16} />} Classificar automaticamente
            </button>
            <button className="botao perigo" onClick={apagarTudo}>
              <Trash2 size={16} /> Limpar tabela
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros">
          <div className="campo-busca">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar pela descrição"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
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
              <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="direita">Valor</th></tr>
            </thead>
            <tbody>
              {filtradas.map((m) => (
                <tr key={m.id}>
                  <td className="num">{dataBR(m.data_movimentacao)}</td>
                  <td>{m.descricao}</td>
                  <td>
                    <select value={m.categoria} onChange={(e) => mudarCategoria(m.id, e.target.value)}>
                      {categorias.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className={`direita num ${m.valor >= 0 ? "positivo" : "negativo"}`}>{dinheiro(m.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
