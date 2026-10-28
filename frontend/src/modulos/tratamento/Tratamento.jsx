// Tratamento.jsx
// Módulo de tratamento: lista as contas e, conforme o perfil do usuário:
//  - analista: classifica (manual ou automático), comenta e pode limpar a tabela;
//  - estagiário: só lança contas novas à mão e consulta a lista;
//  - gestor: consulta a lista e lê os comentários.
// Esta tela só orquestra: os pedaços visuais ficam em FormLancamento, FiltrosMovimentacoes,
// ProgressoClassificacao e TabelaMovimentacoes.
import { useState } from "react";
import { Inbox, Plus, Trash2, Zap } from "lucide-react";
import Alerta from "../../compartilhado/Alerta.jsx";
import Botao from "../../compartilhado/Botao.jsx";
import { Carregando } from "../../compartilhado/Carregando.jsx";
import EstadoVazio from "../../compartilhado/EstadoVazio.jsx";
import Painel from "../../compartilhado/Painel.jsx";
import { useFormulario } from "../../compartilhado/useFormulario.js";
import { useMensagem } from "../../compartilhado/useMensagem.js";
import { useRequisicao } from "../../compartilhado/useRequisicao.js";
import { useAuth } from "../auth/AuthContext.jsx";
import PainelComentarios from "../comentarios/PainelComentarios.jsx";
import FiltrosMovimentacoes from "./FiltrosMovimentacoes.jsx";
import FormLancamento from "./FormLancamento.jsx";
import ProgressoClassificacao from "./ProgressoClassificacao.jsx";
import TabelaMovimentacoes from "./TabelaMovimentacoes.jsx";
import { tratamentoApi } from "./tratamento.api.js";

// Valores iniciais do formulário de lançamento manual
const FORM_VAZIO = { data_movimentacao: "", tipo: "saida", valor: "", descricao: "" };

export default function Tratamento({ irPara }) {
  const { pode } = useAuth();
  const { mensagem, avisarOk, avisarErro } = useMensagem();

  // Ao abrir a tela, busca as contas e as categorias (null = ainda carregando)
  const contas = useRequisicao(() => tratamentoApi.movimentacoes());
  const listaCategorias = useRequisicao(() => tratamentoApi.categorias());
  const movimentacoes = contas.dados ?? [];
  const categorias = listaCategorias.dados ?? [];

  const formulario = useFormulario(FORM_VAZIO, { aoErro: avisarErro });
  const [classificando, setClassificando] = useState(false);
  const [comentando, setComentando] = useState(null); // conta com o painel de comentários aberto

  // Filtros da tabela
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const podeEditar = pode("movimentacoes:editar");

  // Altera a categoria no servidor e atualiza só essa linha na tela
  async function mudarCategoria(id, categoria) {
    try {
      await tratamentoApi.classificar(id, categoria);
      contas.setDados((lista) => lista.map((m) => (m.id === id ? { ...m, categoria } : m)));
    } catch (e) {
      avisarErro(e.message);
    }
  }

  // Aplica as regras automáticas em tudo que está "Sem categoria"
  async function classificarAutomatico() {
    setClassificando(true);
    try {
      const r = await tratamentoApi.classificarAutomatico();
      avisarOk(`${r.atualizadas} movimentações classificadas automaticamente.`);
      await contas.recarregar();
    } catch (e) {
      avisarErro(e.message);
    }
    setClassificando(false);
  }

  // Ação destrutiva: pede confirmação antes
  async function apagarTudo() {
    if (!window.confirm("Tem certeza que quer apagar TODAS as movimentações?")) return;
    try {
      const r = await tratamentoApi.apagarTudo();
      avisarOk(`${r.apagadas} movimentações apagadas.`);
      await contas.recarregar();
    } catch (e) {
      avisarErro(e.message);
    }
  }

  // Lançamento manual: saída vira valor negativo, entrada positivo
  async function lancar(valores) {
    const numero = Math.abs(Number(String(valores.valor).replace(",", ".")));
    await tratamentoApi.criar({
      data_movimentacao: valores.data_movimentacao,
      valor: valores.tipo === "saida" ? -numero : numero,
      descricao: valores.descricao,
    });
    avisarOk("Lançamento registrado.");
    formulario.fechar();
    await contas.recarregar();
  }

  // O painel de comentários avisa quando alguém comentou/apagou, para atualizar o contador
  function ajustarComentarios(id, delta) {
    contas.setDados((lista) =>
      lista.map((m) => (m.id === id ? { ...m, qtd_comentarios: m.qtd_comentarios + delta } : m))
    );
  }

  if (contas.carregando || listaCategorias.carregando) {
    return <Carregando texto="Buscando movimentações no banco..." />;
  }

  const alertas = (
    <>
      <Alerta mensagem={mensagem} />
      <Alerta tipo="erro">{contas.erro || listaCategorias.erro}</Alerta>
    </>
  );

  const botaoNovo = pode("movimentacoes:criar") && (
    <Botao variante="claro" icone={Plus} onClick={formulario.abrir}>Novo lançamento</Botao>
  );

  // Banco vazio: oriento o usuário
  if (movimentacoes.length === 0) {
    return (
      <>
        {alertas}
        <EstadoVazio icone={Inbox} titulo="Nada por aqui ainda" texto="Importe um arquivo OFX ou faça um lançamento manual.">
          <div className="acoes centro">
            {pode("importacao:criar") && <Botao onClick={() => irPara("importacao")}>Ir para Importação</Botao>}
            {botaoNovo}
          </div>
          <FormLancamento formulario={formulario} aoSalvar={lancar} />
        </EstadoVazio>
      </>
    );
  }

  const pendentes = movimentacoes.filter((m) => m.categoria === "Sem categoria").length;

  const filtradas = movimentacoes.filter((m) => {
    const bateBusca = m.descricao.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = filtroCategoria === "Todas" || m.categoria === filtroCategoria;
    return bateBusca && bateCategoria;
  });

  return (
    <>
      {alertas}

      <ProgressoClassificacao total={movimentacoes.length} pendentes={pendentes} />

      <Painel
        titulo="Contas"
        subtitulo={podeEditar ? "Escolha a categoria de cada movimentação" : "Consulta das movimentações"}
        acoes={
          <div className="acoes sem-margem">
            {botaoNovo}
            {podeEditar && (
              <Botao icone={Zap} carregando={classificando} onClick={classificarAutomatico}>
                Classificar automaticamente
              </Botao>
            )}
            {pode("movimentacoes:apagar") && (
              <Botao variante="perigo" icone={Trash2} onClick={apagarTudo}>Limpar tabela</Botao>
            )}
          </div>
        }
      >
        <FormLancamento formulario={formulario} aoSalvar={lancar} />

        <FiltrosMovimentacoes
          busca={busca}
          aoBuscar={setBusca}
          categoria={filtroCategoria}
          aoMudarCategoria={setFiltroCategoria}
          categorias={categorias}
          quantidade={filtradas.length}
        />

        <TabelaMovimentacoes
          movimentacoes={filtradas}
          categorias={categorias}
          podeEditar={podeEditar}
          podeComentar={pode("comentarios:ler")}
          aoMudarCategoria={mudarCategoria}
          aoComentar={setComentando}
        />
      </Painel>

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
